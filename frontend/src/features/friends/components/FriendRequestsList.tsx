import React from 'react';
import { Link } from 'react-router';
import { Avatar } from '@/shared/ui/Avatar/Avatar';
import type { FriendRequestItem, FriendRequestUser } from '../types';

interface FriendRequestsListProps {
  receivedRequests: FriendRequestItem[];
  sentRequests: FriendRequestItem[];
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

function resolveUser(req: FriendRequestItem, type: 'received' | 'sent') {
  // En recibidas el otro usuario es requester; en enviadas es addressee
  const target: FriendRequestUser | undefined = type === 'received' ? req.requester : req.addressee;
  const username = target?.username ?? `user_${target?.user_id ?? 'unknown'}`;
  const avatar = target?.profile_picture ?? undefined;

  return { username, avatar };
}

export const FriendRequestsList: React.FC<FriendRequestsListProps> = ({
  receivedRequests,
  sentRequests,
  onAccept,
  onReject,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Solicitudes entrantes */}
      <div>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', color: 'var(--ink, #1f2937)' }}>
          Incoming Requests ({receivedRequests.length})
        </h3>
        {receivedRequests.length === 0 ? (
          <p style={{ color: 'var(--muted, #64748b)' }}>No incoming friend requests.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {receivedRequests.map((req) => {
              const { username, avatar } = resolveUser(req, 'received');
              const reqId = req.friend_request_id;

              return (
                <div
                  key={reqId}
                  className="panel"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderRadius: '14px',
                    border: '1px solid var(--line, #e2e8f0)',
                    background: 'var(--ground, #ffffff)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <Avatar src={avatar} name={username} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <Link
                        to={`/profile/${username}`}
                        style={{ fontWeight: 600, color: 'var(--ink, #1f2937)', textDecoration: 'none' }}
                      >
                        @{username}
                      </Link>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted, #64748b)' }}>
                        Received {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Date unavailable'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn"
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.85rem',
                        borderRadius: '999px',
                        background: 'var(--brand, #265c4b)',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onClick={() => onAccept(reqId)}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.85rem',
                        borderRadius: '999px',
                        cursor: 'pointer',
                      }}
                      onClick={() => onReject(reqId)}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Solicitudes salientes */}
      <div>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', color: 'var(--ink, #1f2937)' }}>
          Sent Requests ({sentRequests.length})
        </h3>
        {sentRequests.length === 0 ? (
          <p style={{ color: 'var(--muted, #64748b)' }}>No pending sent requests.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sentRequests.map((req) => {
              const { username, avatar } = resolveUser(req, 'sent');
              const reqId = req.friend_request_id;

              return (
                <div
                  key={reqId}
                  className="panel"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderRadius: '14px',
                    border: '1px solid var(--line, #e2e8f0)',
                    background: 'var(--ground, #ffffff)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <Avatar src={avatar} name={username} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <Link
                        to={`/profile/${username}`}
                        style={{ fontWeight: 600, color: 'var(--ink, #1f2937)', textDecoration: 'none' }}
                      >
                        @{username}
                      </Link>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted, #64748b)' }}>
                        Sent {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Date unavailable'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        background: 'var(--surface, #f1f5f9)',
                        color: 'var(--muted, #64748b)',
                      }}
                    >
                      Pending
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};