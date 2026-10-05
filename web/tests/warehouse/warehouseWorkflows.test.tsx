import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const hooks = vi.hoisted(() => ({
  useReceivePackageMutation: vi.fn(),
  useCreateDispatchBatchMutation: vi.fn(),
  useReplaceDispatchBatchItemsMutation: vi.fn(),
  useValidateDispatchCandidateMutation: vi.fn(),
  useGetDispatchBatchValidationQuery: vi.fn(),
  useRunDispatchAgentValidationMutation: vi.fn(),
  useGetWarehouseThroughputQuery: vi.fn(),
  useGetPackagesQuery: vi.fn(),
  useGetStorageZonesQuery: vi.fn(),
  useGetIntakeOrdersQuery: vi.fn(),
}))

const fleetHooks = vi.hoisted(() => ({ useGetVehiclesQuery: vi.fn() }))

vi.mock('../../src/features/warehouse/warehouseApi', () => hooks)
vi.mock('../../src/features/fleet/api/fleetApi', () => fleetHooks)

import { ApiMessage, userFacingApiError } from '../../src/features/warehouse/components/ApiMessage'
import { AgentValidationPanel } from '../../src/features/warehouse/components/AgentValidationPanel'
import { CapacityIndicator } from '../../src/features/warehouse/components/CapacityIndicator'
import { DispatchBatchBuilder } from '../../src/features/warehouse/components/DispatchBatchBuilder'
import { PackageIntakeForm } from '../../src/features/warehouse/components/PackageIntakeForm'
import { ValidationResult } from '../../src/features/warehouse/components/ValidationResult'
import { ThroughputPage } from '../../src/features/warehouse/pages/ThroughputPage'
import { DispatchPage } from '../../src/features/warehouse/pages/DispatchPage'
import { renderWithStore, availablePackage, receivedPackage, warehouse, zone } from './testUtils'

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true } as const

const idle = { data: undefined, error: undefined, isLoading: false }
const intakeOrder = {
  id: '11111111-1111-4111-8111-111111111111', deliveryCity: 'Colombo',
  recipientName: 'Test recipient', packageDescription: 'Test parcel', status: 'Pending',
}
const vehicle = { id: '22222222-2222-4222-8222-222222222222', registrationNumber: 'VEH-001', vehicleType: 'Van', capacity: 1000 }
const validation = {
  batchId: 'batch-001', warehouseId: warehouse.id, packageCount: 1, totalWeightKg: 2, totalVolumeM3: 1,
  weightCapacityValid: true, volumeCapacityValid: true, packageAvailabilityValid: true,
  warehouseConsistent: true, fragileLoadOrderValid: true, result: 'PASS' as const, issues: [],
}

beforeEach(() => {
  Object.values(hooks).forEach((hook) => hook.mockReset())
  hooks.useReceivePackageMutation.mockReturnValue([vi.fn(), { isLoading: false }])
  hooks.useCreateDispatchBatchMutation.mockReturnValue([vi.fn(), { isLoading: false }])
  hooks.useReplaceDispatchBatchItemsMutation.mockReturnValue([vi.fn(), { isLoading: false }])
  hooks.useValidateDispatchCandidateMutation.mockReturnValue([vi.fn(), { isLoading: false }])
  hooks.useGetDispatchBatchValidationQuery.mockReturnValue(idle)
  hooks.useRunDispatchAgentValidationMutation.mockReturnValue([vi.fn(), idle])
  hooks.useGetWarehouseThroughputQuery.mockReturnValue(idle)
  hooks.useGetPackagesQuery.mockReturnValue(idle)
  hooks.useGetStorageZonesQuery.mockReturnValue(idle)
  hooks.useGetIntakeOrdersQuery.mockReturnValue({ ...idle, data: [intakeOrder] })
  fleetHooks.useGetVehiclesQuery.mockReturnValue({ ...idle, data: [vehicle] })
})

describe('package intake and safe API feedback', () => {
  const orderId = '11111111-1111-4111-8111-111111111111'

  const fillValidIntake = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.selectOptions(screen.getByLabelText('Order'), orderId)
    await user.selectOptions(screen.getByLabelText('Storage zone'), zone.id)
    await user.type(screen.getByLabelText('Tracking code'), 'TRACK-001')
    await user.type(screen.getByLabelText('Weight (kg)'), '2')
    await user.type(screen.getByLabelText('Volume (m³)'), '1')
  }

  it('submits the real intake payload and shows 201 success', async () => {
    const user = userEvent.setup()
    const unwrap = vi.fn().mockResolvedValue({ id: 'package-001' })
    const receive = vi.fn().mockReturnValue({ unwrap })
    hooks.useReceivePackageMutation.mockReturnValue([receive, { isLoading: false }])
    renderWithStore(<PackageIntakeForm warehouseId={warehouse.id} zones={[zone]} />)

    await fillValidIntake(user)
    await user.click(screen.getByRole('button', { name: 'Receive package' }))

    expect(receive).toHaveBeenCalledWith(expect.objectContaining({
      orderId, warehouseId: warehouse.id, storageZoneId: zone.id, trackingCode: 'TRACK-001', weightKg: 2, volumeM3: 1,
    }))
    expect(await screen.findByText('Package received successfully.')).toBeInTheDocument()
  })

  it('rejects missing, zero, and negative intake values before calling the backend', async () => {
    const user = userEvent.setup()
    const receive = vi.fn()
    hooks.useReceivePackageMutation.mockReturnValue([receive, { isLoading: false }])
    renderWithStore(<PackageIntakeForm warehouseId={warehouse.id} zones={[zone]} />)
    await user.click(screen.getByRole('button', { name: 'Receive package' }))
    expect(screen.getByText(/positive weight and volume are required/i)).toBeInTheDocument()
    expect(receive).not.toHaveBeenCalled()

    await user.selectOptions(screen.getByLabelText('Order'), orderId)
    await user.selectOptions(screen.getByLabelText('Storage zone'), zone.id)
    await user.type(screen.getByLabelText('Tracking code'), 'TRACK-001')
    await user.type(screen.getByLabelText('Weight (kg)'), '-1')
    await user.type(screen.getByLabelText('Volume (m³)'), '0')
    await user.click(screen.getByRole('button', { name: 'Receive package' }))
    expect(receive).not.toHaveBeenCalled()
  })

  it.each([
    [400, /correct the highlighted values/i],
    [404, /could not be found/i],
    [409, /Warehouse conflict/i],
    [500, /temporarily unavailable/i],
    ['FETCH_ERROR', /request could not be completed/i],
  ])('shows a safe intake error for %s without backend details', async (status, expected) => {
    const user = userEvent.setup()
    const receive = vi.fn().mockReturnValue({ unwrap: vi.fn().mockRejectedValue({ status, data: { stack: 'private stack trace' } }) })
    hooks.useReceivePackageMutation.mockReturnValue([receive, { isLoading: false }])
    renderWithStore(<PackageIntakeForm warehouseId={warehouse.id} zones={[zone]} />)
    await fillValidIntake(user)
    await user.click(screen.getByRole('button', { name: 'Receive package' }))
    expect(await screen.findByText(expected)).toBeInTheDocument()
    expect(screen.queryByText(/private stack trace/i)).not.toBeInTheDocument()
  })

  it('rejects a malformed order identifier returned by the intake API', async () => {
    const user = userEvent.setup()
    const receive = vi.fn()
    hooks.useReceivePackageMutation.mockReturnValue([receive, { isLoading: false }])
    hooks.useGetIntakeOrdersQuery.mockReturnValue({ ...idle, data: [{ ...intakeOrder, id: 'not-an-order-uuid' }] })
    renderWithStore(<PackageIntakeForm warehouseId={warehouse.id} zones={[zone]} />)

    await user.selectOptions(screen.getByLabelText('Order'), 'not-an-order-uuid')
    await user.selectOptions(screen.getByLabelText('Storage zone'), zone.id)
    await user.type(screen.getByLabelText('Tracking code'), 'TRACK-001')
    await user.type(screen.getByLabelText('Weight (kg)'), '2')
    await user.type(screen.getByLabelText('Volume (m³)'), '1')
    await user.click(screen.getByRole('button', { name: 'Receive package' }))

    expect(screen.getByText(/valid order UUID/i)).toBeInTheDocument()
    expect(receive).not.toHaveBeenCalled()
  })
})

describe('dispatch creation and backend validation', () => {
  const vehicleFields = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.selectOptions(screen.getByLabelText('Vehicle'), vehicle.id)
    await user.clear(screen.getByLabelText('Max weight (kg)'))
    await user.type(screen.getByLabelText('Max weight (kg)'), '1000')
    await user.clear(screen.getByLabelText('Max volume (m³)'))
    await user.type(screen.getByLabelText('Max volume (m³)'), '10')
  }

  it('offers only Available packages passed from the API, supports selection and deselection, and offers fleet vehicles', async () => {
    const user = userEvent.setup()
    renderWithStore(<DispatchBatchBuilder warehouseId={warehouse.id} packages={[availablePackage]} zones={[zone]} onBatchCreated={vi.fn()} />)
    expect(screen.getByText('TRACK-AVL')).toBeInTheDocument()
    expect(screen.queryByText('TRACK-REC')).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: /VEH-001 — Van \(1000kg\)/ })).toBeInTheDocument()
    await user.click(screen.getByLabelText('Select TRACK-AVL'))
    expect(screen.getByText('1 package(s) selected.')).toBeInTheDocument()
    await user.click(screen.getByLabelText('Select TRACK-AVL'))
    expect(screen.queryByText('1 package(s) selected.')).not.toBeInTheDocument()
  })

  it('shows the internal agent explanation only when returned through the backend', async () => {
    const user = userEvent.setup()
    const runAgent = vi.fn()
    hooks.useRunDispatchAgentValidationMutation.mockReturnValue([runAgent, {
      data: {
        batchId: 'batch-001', deterministicResult: 'PASS', deterministicIssues: [],
        agentAvailable: true, agentConsistent: true, agentResult: 'PASS',
        ruleResults: [{ rule: 'fragile_not_under_heavy', passed: true, detail: 'Fragile packages are top-safe.' }],
        explanation: 'The batch is safe to dispatch.', explanationSource: 'ollama', agentMessage: null,
      },
      error: undefined,
      isLoading: false,
    }])
    renderWithStore(<AgentValidationPanel batchId="batch-001" />)

    await user.click(screen.getByRole('button', { name: 'Generate AI validation explanation' }))

    expect(runAgent).toHaveBeenCalledWith('batch-001')
    expect(screen.getByText('The batch is safe to dispatch.')).toBeInTheDocument()
    expect(screen.getByText(/configured local Ollama model/i)).toBeInTheDocument()
    expect(screen.getByText(/Fragile Not Under Heavy:/)).toBeInTheDocument()
  })

  it('keeps deterministic validation visible when the agent service is unavailable', () => {
    hooks.useRunDispatchAgentValidationMutation.mockReturnValue([vi.fn(), {
      data: {
        batchId: 'batch-001', deterministicResult: 'PASS', deterministicIssues: [],
        agentAvailable: false, agentConsistent: false, agentResult: null, ruleResults: [],
        explanation: null, explanationSource: null,
        agentMessage: 'The deterministic backend result is available, but the internal agent explanation service is currently unavailable.',
      },
      error: undefined,
      isLoading: false,
    }])
    renderWithStore(<AgentValidationPanel batchId="batch-001" />)

    expect(screen.getByText('Deterministic backend decision: PASS')).toBeInTheDocument()
    expect(screen.getByText(/agent explanation service is currently unavailable/i)).toBeInTheDocument()
  })

  it('requests only Available packages for the dispatch page', () => {
    hooks.useGetPackagesQuery.mockReturnValue({ ...idle, data: { items: [availablePackage], page: 1, pageSize: 100, totalCount: 1, totalPages: 1 } })
    hooks.useGetStorageZonesQuery.mockReturnValue({ ...idle, data: [zone] })
    renderWithStore(<MemoryRouter initialEntries={['/warehouse/warehouse-001/dispatch']} future={routerFuture}><Routes><Route path="/warehouse/:warehouseId/dispatch" element={<DispatchPage />} /></Routes></MemoryRouter>)

    expect(hooks.useGetPackagesQuery).toHaveBeenCalledWith(
      { warehouseId: warehouse.id, page: 1, pageSize: 100, status: 'Available' },
      { skip: false },
    )
    expect(screen.getByText('TRACK-AVL')).toBeInTheDocument()
    expect(screen.queryByText('TRACK-REC')).not.toBeInTheDocument()
  })

  it('sends an overweight but well-formed candidate to S3 and renders its FAIL result without creating a batch', async () => {
    const user = userEvent.setup()
    const create = vi.fn()
    const validate = vi.fn().mockReturnValue({ unwrap: vi.fn().mockResolvedValue({
      result: 'FAIL', agentAvailable: true,
      ruleResults: [{ rule: 'within_weight_capacity', passed: false, detail: 'Package weight exceeds vehicle capacity.' }],
      explanation: 'The selected vehicle capacity is exceeded.', explanationSource: 'deterministic_fallback',
      rejectionReasons: ['Package weight exceeds vehicle capacity.'], agentMessage: null,
    }) })
    const created = vi.fn()
    hooks.useCreateDispatchBatchMutation.mockReturnValue([create, { isLoading: false }])
    hooks.useValidateDispatchCandidateMutation.mockReturnValue([validate, { isLoading: false }])
    renderWithStore(<DispatchBatchBuilder warehouseId={warehouse.id} packages={[availablePackage]} zones={[zone]} onBatchCreated={created} />)
    await vehicleFields(user)
    await user.clear(screen.getByLabelText('Max weight (kg)'))
    await user.type(screen.getByLabelText('Max weight (kg)'), '1')
    await user.click(screen.getByLabelText('Select TRACK-AVL'))
    await user.click(screen.getByRole('button', { name: 'Validate allocation' }))

    expect(validate).toHaveBeenCalledWith({
      warehouseId: warehouse.id, packageIds: [availablePackage.id], orderIds: [availablePackage.orderId],
      vehicleId: vehicle.id, maxWeightKg: 1, maxVolumeM3: 10,
    })
    expect(await screen.findByText('S3 Load & Dispatch Validation: FAIL')).toBeInTheDocument()
    expect(screen.getAllByText('Package weight exceeds vehicle capacity.')).toHaveLength(2)
    expect(create).not.toHaveBeenCalled()
    expect(created).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Create reserved batch' })).not.toBeInTheDocument()
  })

  it('allows atomic backend batch creation only after the S3 agent returns PASS', async () => {
    const user = userEvent.setup()
    const batch = { id: 'batch-001', warehouseId: warehouse.id, vehicleId: vehicle.id, maxWeightKg: 1000, maxVolumeM3: 10, totalWeightKg: 2, totalVolumeM3: 1, status: 'Reserved', createdAt: '', updatedAt: null, items: [{ packageId: availablePackage.id, trackingCode: 'TRACK-AVL', loadSequence: 1, weightKg: 2, volumeM3: 1, isFragile: false }] }
    const validate = vi.fn().mockReturnValue({ unwrap: vi.fn().mockResolvedValue({ result: 'PASS', agentAvailable: true, ruleResults: [{ rule: 'within_weight_capacity', passed: true, detail: 'Within capacity.' }], explanation: 'Safe to reserve.', explanationSource: 'ollama', rejectionReasons: [], agentMessage: null }) })
    const create = vi.fn().mockReturnValue({ unwrap: vi.fn().mockResolvedValue({ result: 'PASS', batch, issues: [] }) })
    const created = vi.fn()
    hooks.useValidateDispatchCandidateMutation.mockReturnValue([validate, { isLoading: false }])
    hooks.useCreateDispatchBatchMutation.mockReturnValue([create, { isLoading: false }])
    renderWithStore(<DispatchBatchBuilder warehouseId={warehouse.id} packages={[availablePackage]} zones={[zone]} onBatchCreated={created} />)

    await vehicleFields(user)
    await user.click(screen.getByLabelText('Select TRACK-AVL'))
    await user.click(screen.getByRole('button', { name: 'Validate allocation' }))
    expect(await screen.findByText('S3 Load & Dispatch Validation: PASS')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Create reserved batch' }))

    expect(create).toHaveBeenCalledWith({ warehouseId: warehouse.id, vehicleId: vehicle.id, maxWeightKg: 1000, maxVolumeM3: 10, packageIds: [availablePackage.id] })
    expect(await screen.findByText(/Batch created successfully/i)).toBeInTheDocument()
    expect(created).toHaveBeenCalledWith('batch-001')
  })

  it('updates an existing reserved batch through the item replacement endpoint', async () => {
    const user = userEvent.setup()
    const batch = {
      id: 'batch-001', warehouseId: warehouse.id, vehicleId: vehicle.id, maxWeightKg: 1000,
      maxVolumeM3: 10, totalWeightKg: 2, totalVolumeM3: 1, status: 'Reserved',
      createdAt: '', updatedAt: null,
      items: [{ packageId: availablePackage.id, trackingCode: 'TRACK-AVL', loadSequence: 1, weightKg: 2, volumeM3: 1, isFragile: false }],
    }
    const validate = vi.fn().mockReturnValue({ unwrap: vi.fn().mockResolvedValue({ result: 'PASS', agentAvailable: true, ruleResults: [], explanation: null, explanationSource: 'deterministic_fallback', rejectionReasons: [], agentMessage: null }) })
    const create = vi.fn().mockReturnValue({ unwrap: vi.fn().mockResolvedValue({ result: 'PASS', batch, issues: [] }) })
    const replace = vi.fn().mockReturnValue({ unwrap: vi.fn().mockResolvedValue({ result: 'PASS', batch, issues: [] }) })
    hooks.useCreateDispatchBatchMutation.mockReturnValue([create, { isLoading: false }])
    hooks.useReplaceDispatchBatchItemsMutation.mockReturnValue([replace, { isLoading: false }])
    hooks.useValidateDispatchCandidateMutation.mockReturnValue([validate, { isLoading: false }])
    renderWithStore(<DispatchBatchBuilder warehouseId={warehouse.id} packages={[availablePackage]} zones={[zone]} onBatchCreated={vi.fn()} />)

    await vehicleFields(user)
    await user.click(screen.getByLabelText('Select TRACK-AVL'))
    await user.click(screen.getByRole('button', { name: 'Validate allocation' }))
    await user.click(await screen.findByRole('button', { name: 'Create reserved batch' }))
    await user.click(await screen.findByRole('button', { name: 'Update batch items' }))

    expect(replace).toHaveBeenCalledWith({ batchId: 'batch-001', body: { packageIds: [availablePackage.id] } })
  })

  it.each(['PASS', 'FAIL', 'REVISE'])('renders backend validation %s and every returned safety rule', (result) => {
    hooks.useGetDispatchBatchValidationQuery.mockReturnValue({ ...idle, data: { ...validation, result, issues: ['Deterministic issue.'] } })
    renderWithStore(<ValidationResult batchId="batch-001" />)
    expect(screen.getByRole('heading', { name: `Backend validation: ${result}` })).toBeInTheDocument()
    expect(screen.getByText('Weight capacity: Pass')).toBeInTheDocument()
    expect(screen.getByText('Volume capacity: Pass')).toBeInTheDocument()
    expect(screen.getByText('Reserved package state: Pass')).toBeInTheDocument()
    expect(screen.getByText('Warehouse consistency: Pass')).toBeInTheDocument()
    expect(screen.getByText('Fragile/load-sequence compatibility: Pass')).toBeInTheDocument()
    expect(screen.getByText('Deterministic issue.')).toBeInTheDocument()
  })
})

describe('capacity, throughput, and safe error presentation', () => {
  it('renders capacity as a visual indicator without a safety decision', () => {
    renderWithStore(<CapacityIndicator label="Vehicle volume" occupied={3} total={10} unit="m³" />)
    expect(screen.getByText('3 / 10 m³')).toBeInTheDocument()
    expect(screen.getByText('7 m³ remaining (30.0% occupied)')).toBeInTheDocument()
    expect(screen.queryByText(/PASS|FAIL|REVISE/)).not.toBeInTheDocument()
  })

  it('submits UTC date boundaries and renders actual zero-value throughput fields', async () => {
    const user = userEvent.setup()
    hooks.useGetWarehouseThroughputQuery.mockReturnValue({ ...idle, data: {
      warehouseId: warehouse.id, fromUtc: '', toUtc: '', receivedPackageCount: 0, receivedWeightKg: 0, receivedVolumeM3: 0,
      reservedPackageCount: 0, dispatchedPackageCount: 0, createdDispatchBatchCount: 0, batchedPackageCount: 0,
    } })
    renderWithStore(<MemoryRouter initialEntries={['/warehouse/warehouse-001/throughput']} future={routerFuture}><Routes><Route path="/warehouse/:warehouseId/throughput" element={<ThroughputPage />} /></Routes></MemoryRouter>)
    await user.clear(screen.getByLabelText('From'))
    await user.type(screen.getByLabelText('From'), '2026-09-01')
    await user.clear(screen.getByLabelText('To'))
    await user.type(screen.getByLabelText('To'), '2026-09-30')
    await user.click(screen.getByRole('button', { name: 'Load report' }))
    const latestArgs = hooks.useGetWarehouseThroughputQuery.mock.calls.at(-1)?.[0]
    expect(latestArgs).toEqual({ warehouseId: warehouse.id, fromUtc: '2026-09-01T00:00:00.000Z', toUtc: '2026-09-30T23:59:59.999Z' })
    expect(screen.getByText('Received packages')).toBeInTheDocument()
    expect(screen.getAllByText('0').length).toBeGreaterThan(1)
  })

  it('handles invalid throughput dates, loading, and API failures safely', async () => {
    const user = userEvent.setup()
    hooks.useGetWarehouseThroughputQuery.mockReturnValue({ ...idle, isLoading: true })
    const view = renderWithStore(<MemoryRouter initialEntries={['/warehouse/warehouse-001/throughput']} future={routerFuture}><Routes><Route path="/warehouse/:warehouseId/throughput" element={<ThroughputPage />} /></Routes></MemoryRouter>)
    await user.clear(screen.getByLabelText('From'))
    await user.type(screen.getByLabelText('From'), '2026-10-01')
    await user.clear(screen.getByLabelText('To'))
    await user.type(screen.getByLabelText('To'), '2026-09-01')
    await user.click(screen.getByRole('button', { name: 'Load report' }))
    expect(screen.getByText(/start date is not after/i)).toBeInTheDocument()
    view.unmount()

    hooks.useGetWarehouseThroughputQuery.mockReturnValue({ ...idle, error: { status: 500 } })
    renderWithStore(<MemoryRouter initialEntries={['/warehouse/warehouse-001/throughput']} future={routerFuture}><Routes><Route path="/warehouse/:warehouseId/throughput" element={<ThroughputPage />} /></Routes></MemoryRouter>)
    expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument()
  })

  it.each([
    [{ status: 400 }, /correct the highlighted values/i],
    [{ status: 404 }, /could not be found/i],
    [{ status: 409 }, /Warehouse conflict/i],
    [{ status: 500 }, /temporarily unavailable/i],
    [{ status: 'FETCH_ERROR' }, /request could not be completed/i],
  ])('maps API errors safely', (error, expected) => {
    expect(userFacingApiError(error)).toMatch(expected)
  })

  it('uses accessible API message roles', () => {
    renderWithStore(<ApiMessage kind="error">Safe error</ApiMessage>)
    expect(screen.getByRole('alert')).toHaveTextContent('Safe error')
  })
})
