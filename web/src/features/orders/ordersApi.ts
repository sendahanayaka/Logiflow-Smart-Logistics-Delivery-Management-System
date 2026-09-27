import { baseApi } from '../../app/api';
import { DispatchOrder, INITIAL_DISPATCH_ORDERS } from './types';

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDispatchOrders: builder.query<DispatchOrder[], void>({
      queryFn: () => {
        // Return pre-seeded dispatch-ready orders list for UI operations
        return { data: INITIAL_DISPATCH_ORDERS };
      },
    }),
  }),
});

export const { useGetDispatchOrdersQuery } = ordersApi;
