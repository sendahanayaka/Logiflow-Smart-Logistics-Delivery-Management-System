import { API_BASE_URL, handleApiError, baseApi } from '../../app/api';
import { CreateDeliveryOrderRequest, DeliveryOrderResponse, DispatchOrder, INITIAL_DISPATCH_ORDERS } from './types';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
    };
};

export const createOrder = async (request: CreateDeliveryOrderRequest): Promise<DeliveryOrderResponse> => {
    const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(request)
    });

    await handleApiError(response);
    return response.json();
};

export const getMyOrders = async (): Promise<DeliveryOrderResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/orders/my-orders`, {
        headers: getAuthHeaders()
    });

    await handleApiError(response);
    return response.json();
};

export const getOrderById = async (id: string): Promise<DeliveryOrderResponse> => {
    const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
        headers: getAuthHeaders()
    });

    await handleApiError(response);
    return response.json();
};

export const cancelOrder = async (id: string): Promise<DeliveryOrderResponse> => {
    const response = await fetch(`${API_BASE_URL}/orders/${id}/cancel`, {
        method: 'PATCH',
        headers: getAuthHeaders()
    });

    await handleApiError(response);
    return response.json();
};

export const ordersApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getDispatchOrders: builder.query<DispatchOrder[], void>({
            queryFn: () => {
                // Return pre-seeded dispatch-ready orders list for UI operations
                return { data: INITIAL_DISPATCH_ORDERS };
            },
        }),
        // Customer "My Orders" — cached + tagged so it refetches on every visit and
        // after create/cancel, instead of needing a re-login to see new orders (item 13).
        getMyOrders: builder.query<DeliveryOrderResponse[], void>({
            query: () => '/orders/my-orders',
            providesTags: (result) =>
                result
                    ? [...result.map(({ id }) => ({ type: 'Order' as const, id })), { type: 'Order', id: 'LIST' }]
                    : [{ type: 'Order', id: 'LIST' }],
        }),
        cancelOrderMut: builder.mutation<DeliveryOrderResponse, string>({
            query: (id) => ({ url: `/orders/${id}/cancel`, method: 'PATCH' }),
            invalidatesTags: (_r, _e, id) => [{ type: 'Order', id }, { type: 'Order', id: 'LIST' }],
        }),
    }),
});

export const { useGetDispatchOrdersQuery, useGetMyOrdersQuery, useCancelOrderMutMutation } = ordersApi;
