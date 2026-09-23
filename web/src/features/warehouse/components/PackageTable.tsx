import type { WarehousePackage } from '../warehouseApi'

export function PackageTable({ packages }: { packages: WarehousePackage[] }) {
  return <ul>{packages.map((item) => <li key={item.id}>{item.trackingCode} — {item.status}</li>)}</ul>
}
