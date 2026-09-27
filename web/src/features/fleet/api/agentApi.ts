import { baseApi } from '../../../app/api';

export interface WorkflowRunResponse {
  workflow_id: string;
  status: string;
  proposal?: {
    triage?: {
      validated_order_ids?: string[];
      priority_class?: string;
      special_handling_flags?: string[];
    };
    allocation?: {
      workflow_id?: string;
      proposed?: {
        driver_id: string;
        vehicle_id: string;
        order_ids?: string[];
        compatible_order_ids?: string[];
        incompatible_order_ids?: string[];
        total_weight_kg?: number;
        total_volume_m3?: number;
        capacity_utilization_percent?: number;
        reasons: string[];
        constraints_checked: string[];
      };
      alternatives?: Array<{
        driver_id: string;
        vehicle_id: string;
        order_ids?: string[];
        total_weight_kg?: number;
        total_volume_m3?: number;
        capacity_utilization_percent?: number;
        reasons: string[];
      }>;
      compliance_passed?: boolean;
    };
    validation?: {
      result?: string;
    };
    routing?: {
      sequenced_stops?: any[];
      total_distance_km?: number;
      total_duration_min?: number;
    };
  };
  audit?: Array<{
    step: string;
    agent: string;
    summary: string;
    tool_calls: string[];
  }>;
  errors?: string[];
}

export const agentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAgentHealth: builder.query<{ status: string; model: string }, void>({
      query: () => ({
        url: '/agent-api/health',
      }),
    }),
    runWorkflow: builder.mutation<WorkflowRunResponse, { payload: any }>({
      query: (body) => ({
        url: '/agent-api/workflow/run',
        method: 'POST',
        body,
      }),
    }),
    getWorkflowState: builder.query<any, string>({
      query: (id) => `/agent-api/workflow/${id}`,
    }),
    approveWorkflow: builder.mutation<any, { workflow_id: string; action: 'APPROVE' | 'REJECT'; decided_by?: string }>({
      query: ({ workflow_id, action, decided_by }) => ({
        url: `/agent-api/workflow/${workflow_id}/approval`,
        method: 'POST',
        body: { action, decided_by: decided_by || 'ops-manager' },
      }),
    }),
  }),
});

export const {
  useGetAgentHealthQuery,
  useRunWorkflowMutation,
  useGetWorkflowStateQuery,
  useApproveWorkflowMutation,
} = agentApi;
