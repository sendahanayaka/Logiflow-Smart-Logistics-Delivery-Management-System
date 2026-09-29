// [S4]  delivery API slice — workflows, approvals, shipments, tracking, driver run.
import { baseApi } from '../../app/api';
import type {
  WorkflowSummary,
  WorkflowResponse,
  ApprovalResult,
  ApproveWorkflowRequest,
  TriggerWorkflowRequest,
  ShipmentSummary,
  TrackingView,
  DriverRunView,
  RecordStopEventRequest,
  RecordPodRequest,
} from './types';

export const deliveryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // --- workflows / approvals (ADMIN) ---
    getWorkflows: builder.query<WorkflowSummary[], { status?: string } | void>({
      query: (args) => (args && args.status ? `/workflows?status=${args.status}` : '/workflows'),
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Workflow' as const, id })), { type: 'Workflow', id: 'LIST' }]
          : [{ type: 'Workflow', id: 'LIST' }],
    }),
    getWorkflow: builder.query<WorkflowResponse, string>({
      query: (id) => `/workflows/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Workflow', id }],
    }),
    triggerWorkflow: builder.mutation<WorkflowResponse, TriggerWorkflowRequest>({
      query: (body) => ({ url: '/workflows', method: 'POST', body }),
      invalidatesTags: [{ type: 'Workflow', id: 'LIST' }],
    }),
    approveWorkflow: builder.mutation<ApprovalResult, { id: string; body: ApproveWorkflowRequest }>({
      query: ({ id, body }) => ({ url: `/workflows/${id}/approval`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Workflow', id },
        { type: 'Workflow', id: 'LIST' },
        { type: 'Shipment', id: 'LIST' },
      ],
    }),

    // --- shipments / tracking ---
    getShipments: builder.query<ShipmentSummary[], void>({
      query: () => '/shipments',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Shipment' as const, id })), { type: 'Shipment', id: 'LIST' }]
          : [{ type: 'Shipment', id: 'LIST' }],
    }),
    getMyRuns: builder.query<ShipmentSummary[], void>({
      query: () => '/shipments/mine',
      providesTags: (result) =>
        result
          ? [...result.map(({ id }) => ({ type: 'Shipment' as const, id })), { type: 'Shipment', id: 'LIST' }]
          : [{ type: 'Shipment', id: 'LIST' }],
    }),
    getDriverRun: builder.query<DriverRunView, string>({
      query: (id) => `/shipments/${id}/run`,
      providesTags: (_r, _e, id) => [{ type: 'Shipment', id }],
    }),
    getTracking: builder.query<TrackingView, string>({
      query: (id) => `/tracking/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Tracking', id }],
    }),
    getTrackingByCode: builder.query<TrackingView, string>({
      query: (code) => `/tracking/code/${encodeURIComponent(code)}`,
      providesTags: (_r, _e, code) => [{ type: 'Tracking', id: code }],
    }),
    recordStopEvent: builder.mutation<TrackingView, { id: string; body: RecordStopEventRequest }>({
      query: ({ id, body }) => ({ url: `/shipments/${id}/events`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Tracking', id },
        { type: 'Shipment', id },
        { type: 'Shipment', id: 'LIST' },
      ],
    }),
    recordPod: builder.mutation<TrackingView, { id: string; body: RecordPodRequest }>({
      query: ({ id, body }) => ({ url: `/shipments/${id}/pod`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'Tracking', id },
        { type: 'Shipment', id },
        { type: 'Shipment', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetWorkflowsQuery,
  useGetWorkflowQuery,
  useTriggerWorkflowMutation,
  useApproveWorkflowMutation,
  useGetShipmentsQuery,
  useGetMyRunsQuery,
  useGetDriverRunQuery,
  useGetTrackingQuery,
  useLazyGetTrackingByCodeQuery,
  useRecordStopEventMutation,
  useRecordPodMutation,
} = deliveryApi;
