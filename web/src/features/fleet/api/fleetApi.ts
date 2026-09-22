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
} = fleetApi;
