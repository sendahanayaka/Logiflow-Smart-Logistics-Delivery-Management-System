import { ApiMessage, userFacingApiError } from '../components/ApiMessage'
import { CreateWarehouseForm } from '../components/CreateWarehouseForm'
import { WarehouseTable } from '../components/WarehouseTable'
import { useGetWarehousesQuery } from '../warehouseApi'

export function WarehouseListPage() {
  const { data, error, isLoading } = useGetWarehousesQuery()

  return (
    <section className="warehouse-list-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Operations workspace</p>
          <h1>Warehouses</h1>
          <p>Monitor capacity, receive inventory, and prepare dispatch batches from one place.</p>
        </div>
      </div>

      {isLoading && <ApiMessage>Loading warehouses…</ApiMessage>}
      {error && <ApiMessage kind="error">{userFacingApiError(error, 'Warehouses could not be loaded.')}</ApiMessage>}
      {!isLoading && !error && !data?.length && (
        <div className="empty-state">
          <h2>Your warehouse workspace is ready</h2>
          <p>No warehouses are currently available. Create the first one below to start using LogiFlow.</p>
        </div>
      )}
      {!!data?.length && <WarehouseTable warehouses={data} />}
      {!isLoading && !error && <CreateWarehouseForm />}
    </section>
  )
}
