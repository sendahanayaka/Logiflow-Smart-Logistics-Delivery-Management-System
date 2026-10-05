import React from 'react';
import { Link } from 'react-router-dom';
import { useGetConversationsQuery } from './messagingApi';
import './messaging.css';

const timeAgo = (iso: string | null) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString();
};

export const MessagesPage: React.FC = () => {
  const { data: conversations = [], isLoading, isError, refetch } = useGetConversationsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 20000,
  });

  return (
    <div className="msg-page">
      <h1 className="msg-page__title">Messages</h1>
      {isLoading ? (
        <p className="msg-muted">Loading conversations…</p>
      ) : isError ? (
        <div className="msg-muted">
          Couldn’t load your conversations. <button className="msg-link" onClick={() => refetch()}>Retry</button>
        </div>
      ) : conversations.length === 0 ? (
        <p className="msg-muted">No conversations yet. You’ll see a chat here once a driver is assigned to your order.</p>
      ) : (
        <ul className="msg-convo-list">
          {conversations.map((c) => (
            <li key={c.orderId}>
              <Link to={`/messages/${c.orderId}`} className="msg-convo">
                <div className="msg-convo__avatar">{c.counterpartyName.charAt(0).toUpperCase()}</div>
                <div className="msg-convo__body">
                  <div className="msg-convo__row">
                    <strong>{c.counterpartyName}</strong>
                    <span className="msg-convo__time">{timeAgo(c.lastMessageAt)}</span>
                  </div>
                  <div className="msg-convo__row">
                    <span className="msg-convo__preview">{c.lastMessage ?? `Order ${c.orderRef} · ${c.deliveryCity}`}</span>
                    {c.unreadCount > 0 && <span className="msg-badge">{c.unreadCount}</span>}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
