import {
  useGetDriversQuery,
  useGetDriverByIdQuery,
  useCreateDriverMutation,
  useUpdateDriverMutation,
  useDeleteDriverMutation,
  useGetVehiclesQuery,
  useGetVehicleByIdQuery,
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
  useDeleteVehicleMutation,
  useAssignDriverMutation,
  useEndAssignmentMutation,
  useGetActiveAssignmentsQuery,
  useGetAssignmentHistoryQuery,
} from '../api/fleetApi';

export const useFleet = () => {
  return {
    useGetDriversQuery,
    useGetDriverByIdQuery,
    useCreateDriverMutation,
    useUpdateDriverMutation,
    useDeleteDriverMutation,
    useGetVehiclesQuery,
    useGetVehicleByIdQuery,
    useCreateVehicleMutation,
    useUpdateVehicleMutation,
    useDeleteVehicleMutation,
    useAssignDriverMutation,
    useEndAssignmentMutation,
    useGetActiveAssignmentsQuery,
    useGetAssignmentHistoryQuery,
  };
};
