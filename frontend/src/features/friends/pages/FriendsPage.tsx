import React, { useState } from 'react';
import { useSocialManagement } from '../api/useSocialManagement';
import { FriendCard } from '../components/FriendCard';
import { FriendRequestsList } from '../components/FriendRequestsList';

export const FriendsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const {
    friends,
    receivedRequests,
    sentRequests,
    loading,
    error,
    acceptRequest,
    rejectRequest,
    removeFriend,
    blockFriend,
  } = useSocialManagement();

  if (loading) {
    return (
      <div className="dashboard" style={{ display: 'flex', justifyContent: 'center', padding: '3rem 1rem' }}>
        <p className="help">Loading social directory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard" style={{ display: 'flex', justifyContent: 'center', padding: '3rem 1rem' }}>
        <p className="help help--error" style={{ color: 'var(--danger, #dc2626)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="dashboard" style={{ display: 'flex', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div className="card" style={{ maxWidth: '680px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Cabecera */}
        <header style={{ borderBottom: '1px solid var(--line, #e2e8f0)', paddingBottom: '1rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: 'var(--ink, #1f2937)' }}>
            Social Directory
          </h1>
          <p className="help" style={{ margin: '4px 0 0 0', color: 'var(--muted, #64748b)' }}>
            Manage your neighborhood connections and incoming friendship requests.
          </p>
        </header>

        {/* Barra de Pestañas tipo Pill Tabs */}
        <div style={{ display: 'flex', gap: '10px', background: 'var(--surface, #f8f5ef)', padding: '6px', borderRadius: '12px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('friends')}
            className="btn"
            style={{
              flex: 1,
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'friends' ? 'var(--brand, #265c4b)' : 'transparent',
              color: activeTab === 'friends' ? '#ffffff' : 'var(--ink, #263f36)',
              transition: 'background 0.2s ease, color 0.2s ease',
            }}
          >
            My Friends ({friends.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className="btn"
            style={{
              flex: 1,
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: activeTab === 'requests' ? 'var(--brand, #265c4b)' : 'transparent',
              color: activeTab === 'requests' ? '#ffffff' : 'var(--ink, #263f36)',
              transition: 'background 0.2s ease, color 0.2s ease',
            }}
          >
            Requests ({receivedRequests.length})
          </button>
        </div>

        {/* Contenedor principal de la pestaña activa */}
        <div style={{ marginTop: '0.5rem' }}>
          {activeTab === 'friends' ? (
            friends.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'var(--surface, #f8f5ef)', borderRadius: '12px' }}>
                <p style={{ margin: 0, fontWeight: 500, color: 'var(--muted, #64748b)' }}>
                  You don't have any friends added yet.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {friends.map((friend) => (
                  <FriendCard
                    key={friend.user_id}
                    friend={friend}
                    onRemove={removeFriend}
                    onBlock={blockFriend}
                  />
                ))}
              </div>
            )
          ) : (
            <FriendRequestsList
              receivedRequests={receivedRequests}
              sentRequests={sentRequests}
              onAccept={acceptRequest}
              onReject={rejectRequest}
            />
          )}
        </div>

      </div>
    </div>
  );
};