import { baseApi } from '../../../app/api';
import {
  Driver,
  CreateDriverRequest,
  UpdateDriverRequest,
  Vehicle,
  CreateVehicleRequest,
  UpdateVehicleRequest,
  CreateAssignmentRequest,
  EndAssignmentRequest,
  AssignmentResponse,
  DutyScheduleResponse,
  CreateDutyScheduleRequest,
  UpdateDutyScheduleRequest,
  DriverAvailabilityResponse,
  MaintenanceRecordResponse,
  CreateMaintenanceRecordRequest,
  UpdateMaintenanceRecordRequest,
  VehicleMaintenanceStatusResponse,
} from '../types';

export const fleetApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDrivers: builder.query<Driver[], void>({
      query: () => '/Drivers',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Driver' as const, id })),
              { type: 'Driver', id: 'LIST' },
            ]
          : [{ type: 'Driver', id: 'LIST' }],
    }),
    getDriverById: builder.query<Driver, string>({
      query: (id) => `/Drivers/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Driver', id }],
    }),
    createDriver: builder.mutation<Driver, CreateDriverRequest>({
      query: (body) => ({
        url: '/Drivers',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Driver', id: 'LIST' }],
    }),
    updateDriver: builder.mutation<Driver, { id: string; data: UpdateDriverRequest }>({
      query: ({ id, data }) => ({
        url: `/Drivers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Driver', id },
        { type: 'Driver', id: 'LIST' },
      ],
    }),
    deleteDriver: builder.mutation<void, string>({
      query: (id) => ({
        url: `/Drivers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Driver', id: 'LIST' }],
    }),

    getVehicles: builder.query<Vehicle[], void>({
      query: () => '/Vehicles',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Vehicle' as const, id })),
              { type: 'Vehicle', id: 'LIST' },
            ]
          : [{ type: 'Vehicle', id: 'LIST' }],
    }),
    getVehicleById: builder.query<Vehicle, string>({
      query: (id) => `/Vehicles/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Vehicle', id }],
    }),
    createVehicle: builder.mutation<Vehicle, CreateVehicleRequest>({
      query: (body) => ({
        url: '/Vehicles',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Vehicle', id: 'LIST' }],
    }),
    updateVehicle: builder.mutation<Vehicle, { id: string; data: UpdateVehicleRequest }>({
      query: ({ id, data }) => ({
        url: `/Vehicles/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Vehicle', id },
        { type: 'Vehicle', id: 'LIST' },
      ],
    }),
    deleteVehicle: builder.mutation<void, string>({
      query: (id) => ({
        url: `/Vehicles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Vehicle', id: 'LIST' }],
    }),

    assignDriver: builder.mutation<AssignmentResponse, CreateAssignmentRequest>({
      query: (body) => ({
        url: '/assignments',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Driver', id: 'LIST' },
        { type: 'Vehicle', id: 'LIST' },
        { type: 'Assignment', id: 'LIST' },
      ],
    }),
    endAssignment: builder.mutation<AssignmentResponse, { id: string; data?: EndAssignmentRequest }>({
      query: ({ id, data }) => ({
        url: `/assignments/${id}/end`,
        method: 'POST',
        body: data || {},
      }),
      invalidatesTags: [
        { type: 'Driver', id: 'LIST' },
        { type: 'Vehicle', id: 'LIST' },
        { type: 'Assignment', id: 'LIST' },
      ],
    }),
    getActiveAssignments: builder.query<AssignmentResponse[], void>({
      query: () => '/assignments/active',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Assignment' as const, id })),
              { type: 'Assignment', id: 'LIST' },
            ]
          : [{ type: 'Assignment', id: 'LIST' }],
    }),
    getAssignmentHistory: builder.query<AssignmentResponse[], void>({
      query: () => '/assignments/history',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Assignment' as const, id })),
              { type: 'Assignment', id: 'LIST' },
            ]
          : [{ type: 'Assignment', id: 'LIST' }],
    }),

    // Duty Schedule Endpoints
    getDutySchedules: builder.query<DutyScheduleResponse[], void>({
      query: () => '/DutySchedules',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'DutySchedule' as const, id })),
              { type: 'DutySchedule', id: 'LIST' },
            ]
          : [{ type: 'DutySchedule', id: 'LIST' }],
    }),
    getDutyScheduleById: builder.query<DutyScheduleResponse, string>({
      query: (id) => `/DutySchedules/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'DutySchedule', id }],
    }),
    getDutySchedulesByDriver: builder.query<DutyScheduleResponse[], string>({
      query: (driverId) => `/DutySchedules/driver/${driverId}`,
      providesTags: (result, _error, driverId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'DutySchedule' as const, id })),
              { type: 'DutySchedule', id: `DRIVER_${driverId}` },
              { type: 'DutySchedule', id: 'LIST' },
            ]
          : [
              { type: 'DutySchedule', id: `DRIVER_${driverId}` },
              { type: 'DutySchedule', id: 'LIST' },
            ],
    }),
    createDutySchedule: builder.mutation<DutyScheduleResponse, CreateDutyScheduleRequest>({
      query: (body) => ({
        url: '/DutySchedules',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'DutySchedule', id: 'LIST' }],
    }),
    updateDutySchedule: builder.mutation<DutyScheduleResponse, { id: string; data: UpdateDutyScheduleRequest }>({
      query: ({ id, data }) => ({
        url: `/DutySchedules/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'DutySchedule', id },
        { type: 'DutySchedule', id: 'LIST' },
      ],
    }),
    deleteDutySchedule: builder.mutation<void, string>({
      query: (id) => ({
        url: `/DutySchedules/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'DutySchedule', id: 'LIST' }],
    }),
    checkDriverAvailability: builder.query<DriverAvailabilityResponse, { driverId: string; startTime: string; endTime: string }>({
      query: ({ driverId, startTime, endTime }) =>
        `/DutySchedules/driver/${driverId}/availability?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`,
      providesTags: (_result, _error, { driverId }) => [{ type: 'DutySchedule', id: `AVAILABILITY_${driverId}` }],
    }),

    // Maintenance Record Endpoints
    getMaintenanceRecords: builder.query<MaintenanceRecordResponse[], void>({
      query: () => '/MaintenanceRecords',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'MaintenanceRecord' as const, id })),
              { type: 'MaintenanceRecord', id: 'LIST' },
            ]
          : [{ type: 'MaintenanceRecord', id: 'LIST' }],
    }),
    getMaintenanceRecordById: builder.query<MaintenanceRecordResponse, string>({
      query: (id) => `/MaintenanceRecords/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'MaintenanceRecord', id }],
    }),
    getMaintenanceRecordsByVehicle: builder.query<MaintenanceRecordResponse[], string>({
      query: (vehicleId) => `/MaintenanceRecords/vehicle/${vehicleId}`,
      providesTags: (result, _error, vehicleId) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'MaintenanceRecord' as const, id })),
              { type: 'MaintenanceRecord', id: `VEHICLE_${vehicleId}` },
              { type: 'MaintenanceRecord', id: 'LIST' },
            ]
          : [
              { type: 'MaintenanceRecord', id: `VEHICLE_${vehicleId}` },
              { type: 'MaintenanceRecord', id: 'LIST' },
            ],
    }),
    createMaintenanceRecord: builder.mutation<MaintenanceRecordResponse, CreateMaintenanceRecordRequest>({
      query: (body) => ({
        url: '/MaintenanceRecords',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'MaintenanceRecord', id: 'LIST' },
        { type: 'Vehicle', id: 'LIST' },
      ],
    }),
    updateMaintenanceRecord: builder.mutation<MaintenanceRecordResponse, { id: string; data: UpdateMaintenanceRecordRequest }>({
      query: ({ id, data }) => ({
        url: `/MaintenanceRecords/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'MaintenanceRecord', id },
        { type: 'MaintenanceRecord', id: 'LIST' },
        { type: 'Vehicle', id: 'LIST' },
      ],
    }),
    deleteMaintenanceRecord: builder.mutation<void, string>({
      query: (id) => ({
        url: `/MaintenanceRecords/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'MaintenanceRecord', id: 'LIST' },
        { type: 'Vehicle', id: 'LIST' },
      ],
    }),
    getVehicleMaintenanceStatus: builder.query<VehicleMaintenanceStatusResponse, string>({
      query: (vehicleId) => `/MaintenanceRecords/vehicle/${vehicleId}/status`,
      providesTags: (_result, _error, vehicleId) => [{ type: 'MaintenanceRecord', id: `STATUS_${vehicleId}` }],
    }),
  }),
});

export const {
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
  useGetDutySchedulesQuery,
  useGetDutyScheduleByIdQuery,
  useGetDutySchedulesByDriverQuery,
  useCreateDutyScheduleMutation,
  useUpdateDutyScheduleMutation,
  useDeleteDutyScheduleMutation,
  useLazyCheckDriverAvailabilityQuery,
  useGetMaintenanceRecordsQuery,
  useGetMaintenanceRecordByIdQuery,
  useGetMaintenanceRecordsByVehicleQuery,
  useCreateMaintenanceRecordMutation,
  useUpdateMaintenanceRecordMutation,
  useDeleteMaintenanceRecordMutation,
  useGetVehicleMaintenanceStatusQuery,
  useLazyGetVehicleMaintenanceStatusQuery,
} = fleetApi;


