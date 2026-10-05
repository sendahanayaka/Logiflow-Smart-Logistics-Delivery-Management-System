import { ApiMessage, userFacingApiError } from '../components/ApiMessage'
import { CreateWarehouseForm } from '../components/CreateWarehouseForm'
import { WarehouseTable } from '../components/WarehouseTable'
import { useGetWarehousesQuery } from '../warehouseApi'
import '../../portals/Portal.css'

export function WarehouseListPage() {
  const { data, error, isLoading } = useGetWarehousesQuery()

  return (
    <div className="portal-container">
      <header className="portal-header fade-in-up">
        <span className="portal-role-badge">OPERATIONS WORKSPACE</span>
        <h1>Global Warehouses</h1>
        <div className="portal-divider"></div>
        <p>Monitor capacity, receive inventory, and prepare dispatch batches from a centralized view.</p>
      </header>

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
    </div>
  )
}
