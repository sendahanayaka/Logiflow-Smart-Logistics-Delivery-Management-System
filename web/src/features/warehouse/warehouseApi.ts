// [S3] Warehouse & dispatch API mapping. Backend DTOs are camel-cased by ASP.NET Core.
import { baseApi } from '../../app/api'

export type Id = string
export type PackageStatus = 'Received' | 'Available' | 'Reserved' | 'Dispatched' | 'OnHold'
export type DispatchBatchResult = 'PASS' | 'FAIL' | 'REVISE'

export interface Warehouse {
  id: Id
  name: string
  location: string
  totalVolumeM3: number
  occupiedVolumeM3: number
  createdAt: string
  updatedAt: string | null
}

export interface StorageZone {
  id: Id
  warehouseId: Id
  name: string
  code: string
  totalVolumeM3: number
  occupiedVolumeM3: number
  createdAt: string
  updatedAt: string | null
}

export interface WarehousePackage {
  id: Id
  orderId: Id
  warehouseId: Id
  storageZoneId: Id
  trackingCode: string
  weightKg: number
  volumeM3: number
  isFragile: boolean
  specialHandling: string | null
  status: PackageStatus
  receivedAt: string
}

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface CreateWarehouseRequest {
  name: string
  location: string
  totalVolumeM3: number
}

export interface CreateStorageZoneRequest {
  name: string
  code: string
  totalVolumeM3: number
}

export interface PackageIntakeRequest {
  orderId: Id
  warehouseId: Id
  storageZoneId: Id
  trackingCode: string
  weightKg: number
  volumeM3: number
  isFragile: boolean
  specialHandling?: string | null
}

export interface InventoryQuery {
  warehouseId: Id
  page?: number
  pageSize?: number
  status?: PackageStatus
  storageZoneId?: Id
  trackingCode?: string
}

export interface VehicleCapacityContextInput {
  vehicleId: string
  maxWeightKg: number
  maxVolumeM3: number
}

export interface CreateDispatchBatchRequest extends VehicleCapacityContextInput {
  warehouseId: Id
  packageIds: Id[]
}

export interface ReplaceDispatchBatchItemsRequest {
  packageIds: Id[]
}

export interface DispatchBatchItem {
  packageId: Id
  trackingCode: string
  loadSequence: number
  weightKg: number
  volumeM3: number
  isFragile: boolean
}

export interface DispatchBatch {
  id: Id
  warehouseId: Id
  vehicleId: string
  maxWeightKg: number
  maxVolumeM3: number
  totalWeightKg: number
  totalVolumeM3: number
  status: string
  items: DispatchBatchItem[]
  createdAt: string
  updatedAt: string | null
}

export interface DispatchBatchCreationResponse {
  result: DispatchBatchResult
  batch: DispatchBatch | null
  issues: string[]
}

export interface DispatchBatchValidationResponse {
  batchId: Id
  warehouseId: Id
  packageCount: number
  totalWeightKg: number
  totalVolumeM3: number
  weightCapacityValid: boolean
  volumeCapacityValid: boolean
  packageAvailabilityValid: boolean
  warehouseConsistent: boolean
  fragileLoadOrderValid: boolean
  result: DispatchBatchResult
  issues: string[]
}

export interface AgentValidationRule {
  rule: string
  passed: boolean
  detail: string | null
}

/** Internal agent output returned only through the ASP.NET Core backend. */
export interface DispatchAgentValidationResponse {
  batchId: Id
  deterministicResult: DispatchBatchResult
  deterministicIssues: string[]
  agentAvailable: boolean
  agentConsistent: boolean
  agentResult: DispatchBatchResult | null
  ruleResults: AgentValidationRule[]
  explanation: string | null
  explanationSource: 'ollama' | 'deterministic_fallback' | null
  agentMessage: string | null
}

export interface ValidateDispatchCandidateRequest extends VehicleCapacityContextInput {
  warehouseId: Id
  packageIds: Id[]
  orderIds: Id[]
  driverId?: string | null
}

export interface DispatchCandidateAgentValidationResponse {
  result: DispatchBatchResult
  agentAvailable: boolean
  ruleResults: AgentValidationRule[]
  explanation: string | null
  explanationSource: 'ollama' | 'deterministic_fallback' | null
  rejectionReasons: string[]
  agentMessage: string | null
}

/** Internal/debug response for the S3 validation agent; do not render in normal UI. */
export interface DispatchBatchValidationContext {
  batchId: Id
  warehouseId: Id
  vehicleId: string
  batchStatus: string
  maxWeightKg: number
  maxVolumeM3: number
  totalWeightKg: number
  totalVolumeM3: number
  packages: Array<{
    packageId: Id
    warehouseId: Id
    trackingCode: string
    status: PackageStatus
    weightKg: number
    volumeM3: number
    isFragile: boolean
    loadSequence: number
  }>
}

export interface ThroughputQuery {
  warehouseId: Id
  fromUtc: string
  toUtc: string
}

export interface WarehouseThroughput {
  warehouseId: Id
  fromUtc: string
  toUtc: string
  receivedPackageCount: number
  receivedWeightKg: number
  receivedVolumeM3: number
  reservedPackageCount: number
  dispatchedPackageCount: number
  createdDispatchBatchCount: number
  batchedPackageCount: number
}

export const warehouseApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getWarehouses: build.query<Warehouse[], void>({
      query: () => '/warehouse',
      providesTags: (result) => [
        { type: 'Warehouse', id: 'LIST' },
        ...(result?.map((warehouse) => ({ type: 'Warehouse' as const, id: warehouse.id })) ?? []),
      ],
    }),
    getWarehouse: build.query<Warehouse, Id>({
      query: (warehouseId) => `/warehouse/${warehouseId}`,
      providesTags: (_result, _error, warehouseId) => [{ type: 'Warehouse', id: warehouseId }],
    }),
    getStorageZones: build.query<StorageZone[], Id>({
      query: (warehouseId) => `/warehouse/${warehouseId}/zones`,
      providesTags: (_result, _error, warehouseId) => [{ type: 'WarehouseZones', id: warehouseId }],
    }),
    createWarehouse: build.mutation<Warehouse, CreateWarehouseRequest>({
      query: (body) => ({ url: '/warehouse', method: 'POST', body }),
      invalidatesTags: [{ type: 'Warehouse', id: 'LIST' }],
    }),
    createStorageZone: build.mutation<StorageZone, { warehouseId: Id; body: CreateStorageZoneRequest }>({
      query: ({ warehouseId, body }) => ({
        url: `/warehouse/${warehouseId}/zones`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { warehouseId }) => [
        { type: 'Warehouse', id: warehouseId },
        { type: 'WarehouseZones', id: warehouseId },
      ],
    }),
    receivePackage: build.mutation<WarehousePackage, PackageIntakeRequest>({
      query: (body) => ({ url: '/warehouse/intake', method: 'POST', body }),
      invalidatesTags: (_result, _error, request) => [
        { type: 'WarehouseInventory', id: request.warehouseId },
        { type: 'Warehouse', id: request.warehouseId },
      ],
    }),
    getPackages: build.query<PagedResult<WarehousePackage>, InventoryQuery>({
      query: ({ warehouseId, ...params }) => ({
        url: `/warehouse/${warehouseId}/packages`,
        params,
      }),
      providesTags: (result, _error, { warehouseId }) => [
        { type: 'WarehouseInventory', id: warehouseId },
        ...(result?.items.map((item) => ({ type: 'Package' as const, id: item.id })) ?? []),
      ],
    }),
    makePackageAvailable: build.mutation<WarehousePackage, Id>({
      query: (packageId) => ({
        url: `/warehouse/packages/${packageId}/availability`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, _error, packageId) => [
        { type: 'Package', id: packageId },
        ...(result ? [{ type: 'WarehouseInventory' as const, id: result.warehouseId }] : []),
      ],
    }),
    createDispatchBatch: build.mutation<DispatchBatchCreationResponse, CreateDispatchBatchRequest>({
      query: (body) => ({ url: '/dispatch/batches', method: 'POST', body }),
      invalidatesTags: (result, _error, request) => [
        { type: 'WarehouseInventory', id: request.warehouseId },
        ...(result?.batch ? [{ type: 'DispatchBatch' as const, id: result.batch.id }] : []),
      ],
    }),
    replaceDispatchBatchItems: build.mutation<
      DispatchBatchCreationResponse,
      { batchId: Id; body: ReplaceDispatchBatchItemsRequest }
    >({
      query: ({ batchId, body }) => ({
        url: `/dispatch/batches/${batchId}/items`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, _error, { batchId }) => [
        { type: 'DispatchBatch', id: batchId },
        ...(result?.batch
          ? [{ type: 'WarehouseInventory' as const, id: result.batch.warehouseId }]
          : []),
      ],
    }),
    getDispatchBatchValidation: build.query<DispatchBatchValidationResponse, Id>({
      query: (batchId) => `/dispatch/batches/${batchId}/validation`,
      providesTags: (_result, _error, batchId) => [{ type: 'DispatchBatch', id: batchId }],
    }),
    runDispatchAgentValidation: build.mutation<DispatchAgentValidationResponse, Id>({
      query: (batchId) => ({
        url: `/dispatch/batches/${batchId}/agent-validation`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, batchId) => [{ type: 'DispatchBatch', id: batchId }],
    }),
    validateDispatchCandidate: build.mutation<
      DispatchCandidateAgentValidationResponse,
      ValidateDispatchCandidateRequest
    >({
      query: (body) => ({ url: '/dispatch/validate-candidate', method: 'POST', body }),
    }),
    getDispatchBatchValidationContext: build.query<DispatchBatchValidationContext, Id>({
      query: (batchId) => `/dispatch/batches/${batchId}/context`,
      providesTags: (_result, _error, batchId) => [{ type: 'DispatchBatch', id: batchId }],
    }),
    getWarehouseThroughput: build.query<WarehouseThroughput, ThroughputQuery>({
      query: ({ warehouseId, fromUtc, toUtc }) => ({
        url: `/warehouse/${warehouseId}/reports/throughput`,
        params: { fromUtc, toUtc },
      }),
      providesTags: (_result, _error, { warehouseId }) => [{ type: 'Throughput', id: warehouseId }],
    }),
  }),
})

export const {
  useGetWarehousesQuery,
  useGetWarehouseQuery,
  useGetStorageZonesQuery,
  useCreateWarehouseMutation,
  useCreateStorageZoneMutation,
  useReceivePackageMutation,
  useGetPackagesQuery,
  useMakePackageAvailableMutation,
  useCreateDispatchBatchMutation,
  useReplaceDispatchBatchItemsMutation,
  useGetDispatchBatchValidationQuery,
  useRunDispatchAgentValidationMutation,
  useValidateDispatchCandidateMutation,
  useGetWarehouseThroughputQuery,
} = warehouseApi
