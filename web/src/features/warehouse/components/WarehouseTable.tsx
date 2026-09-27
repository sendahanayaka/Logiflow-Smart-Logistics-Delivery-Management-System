import { Link } from 'react-router-dom'

import type { Warehouse } from '../warehouseApi'
import { CapacityIndicator } from './CapacityIndicator'

interface WarehouseTableProps {
  warehouses: Warehouse[]
}

export function WarehouseTable({ warehouses }: WarehouseTableProps) {
  return (
    <div className="warehouse-grid">
      {warehouses.map((warehouse) => (
        <article key={warehouse.id} className="warehouse-card">
          <h2>{warehouse.name}</h2>
          <p className="warehouse-location">{warehouse.location}</p>
          <CapacityIndicator
            label="Warehouse volume"
            occupied={warehouse.occupiedVolumeM3}
            total={warehouse.totalVolumeM3}
            unit="m³"
          />
          <Link className="button-link" to={`/warehouse/${warehouse.id}`}>Open warehouse</Link>
        </article>
      ))}
    </div>
  )
}
