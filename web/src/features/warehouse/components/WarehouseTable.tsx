import { Link } from 'react-router-dom'

import type { Warehouse } from '../warehouseApi'
import { CapacityIndicator } from './CapacityIndicator'

interface WarehouseTableProps {
  warehouses: Warehouse[]
}

export function WarehouseTable({ warehouses }: WarehouseTableProps) {
  return (
    <div>
      {warehouses.map((warehouse) => (
        <article key={warehouse.id} style={{ border: '1px solid #d1d5db', marginBottom: 12, padding: 16 }}>
          <h2>{warehouse.name}</h2>
          <p>{warehouse.location}</p>
          <CapacityIndicator
            label="Warehouse volume"
            occupied={warehouse.occupiedVolumeM3}
            total={warehouse.totalVolumeM3}
            unit="m³"
          />
          <p><Link to={`/warehouse/${warehouse.id}`}>Open warehouse</Link></p>
        </article>
      ))}
    </div>
  )
}
