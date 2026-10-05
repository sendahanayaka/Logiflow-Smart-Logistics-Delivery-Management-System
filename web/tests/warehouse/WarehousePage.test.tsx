import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CapacityIndicator } from '../../src/features/warehouse/components/CapacityIndicator'
import { renderWithStore } from './testUtils'

describe('S3 warehouse component smoke coverage', () => {
  it('keeps warehouse capacity presentational', () => {
    renderWithStore(<CapacityIndicator label="Warehouse volume" occupied={20} total={100} unit="m³" />)
    expect(screen.getByText('80 m³ remaining (20.0% occupied)')).toBeInTheDocument()
  })
})
