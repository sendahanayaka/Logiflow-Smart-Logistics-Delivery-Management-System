// Messaging (item 5) — per-order customer↔driver conversations. Near-real-time
// via a short poll on the open conversation, like tracking.
import { baseApi } from '../../app/api';

export interface MessageDto {
  id: string;
  orderId: string;
  senderUserId: string;
  senderRole: string; // CUSTOMER | DRIVER | SYSTEM
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface ConversationSummary {
  orderId: string;
  orderRef: string;
  deliveryCity: string;
  counterpartyName: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export const messagingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getConversations: builder.query<ConversationSummary[], void>({
      query: () => '/conversations',
      providesTags: [{ type: 'Conversation', id: 'LIST' }],
    }),
    getConversation: builder.query<MessageDto[], string>({
      query: (orderId) => `/orders/${orderId}/messages`,
      providesTags: (_r, _e, orderId) => [{ type: 'Message', id: orderId }],
    }),
    sendMessage: builder.mutation<MessageDto, { orderId: string; body: string }>({
      query: ({ orderId, body }) => ({ url: `/orders/${orderId}/messages`, method: 'POST', body: { body } }),
      invalidatesTags: (_r, _e, { orderId }) => [
        { type: 'Message', id: orderId },
        { type: 'Conversation', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetConversationQuery,
  useSendMessageMutation,
} = messagingApi;
