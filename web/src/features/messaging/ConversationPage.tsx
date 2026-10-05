import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { useGetConversationQuery, useSendMessageMutation } from './messagingApi';
import './messaging.css';

const fmt = (iso: string) => new Date(iso).toLocaleString([], { hour: '2-digit', minute: '2-digit' });

export const ConversationPage: React.FC = () => {
  const { orderId = '' } = useParams();
  const myId = useSelector((s: RootState) => s.auth.user?.id);
  const { data: messages = [], isLoading } = useGetConversationQuery(orderId, {
    pollingInterval: 5000,
    refetchOnMountOrArgChange: true,
  });
  const [sendMessage, { isLoading: sending }] = useSendMessageMutation();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setError(null);
    try {
      await sendMessage({ orderId, body }).unwrap();
      setDraft('');
    } catch (err) {
      setError((err as { data?: { message?: string } })?.data?.message ?? 'Could not send. Try again.');
    }
  };

  return (
    <div className="msg-page msg-thread">
      <div className="msg-thread__head">
        <Link to="/messages" className="msg-link">← Messages</Link>
      </div>

      <div className="msg-thread__scroll">
        {isLoading ? (
          <p className="msg-muted">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="msg-muted">No messages yet. Say hello 👋</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderUserId === myId;
            return (
              <div key={m.id} className={`msg-bubble-row${mine ? ' msg-bubble-row--mine' : ''}`}>
                <div className={`msg-bubble${mine ? ' msg-bubble--mine' : ''}`}>
                  <div className="msg-bubble__body">{m.body}</div>
                  <div className="msg-bubble__meta">{m.senderRole} · {fmt(m.createdAt)}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {error && <div className="msg-error">{error}</div>}

      <form className="msg-compose" onSubmit={send}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          maxLength={2000}
        />
        <button type="submit" disabled={sending || !draft.trim()}>{sending ? '…' : 'Send'}</button>
      </form>
    </div>
  );
};
