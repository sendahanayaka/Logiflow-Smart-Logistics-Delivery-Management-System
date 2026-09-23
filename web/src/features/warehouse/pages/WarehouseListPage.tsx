import { ApiMessage, userFacingApiError } from '../components/ApiMessage'
import { WarehouseTable } from '../components/WarehouseTable'
import { useGetWarehousesQuery } from '../warehouseApi'

export function WarehouseListPage() {
  const { data, error, isLoading } = useGetWarehousesQuery()
  if (isLoading) return <ApiMessage>Loading warehouses…</ApiMessage>
  if (error) return <ApiMessage kind="error">{userFacingApiError(error, 'Warehouses could not be loaded.')}</ApiMessage>
  if (!data?.length) return <ApiMessage>No warehouses are currently available.</ApiMessage>
  return <section><h1>Warehouses</h1><WarehouseTable warehouses={data} /></section>
}
