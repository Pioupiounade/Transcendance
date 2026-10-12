import React, { useState, useEffect } from 'react';
import type { FriendshipStatus } from '../types';
import {
  acceptFriendRequest,
  cancelOrRemoveFriend,
  declineFriendRequest,
  sendFriendRequest,
  unblockUser,
} from '../api/profileApi';

interface FriendshipCTAProps {
  userId: string;
  status: FriendshipStatus;
  onStatusChange?: (newStatus: FriendshipStatus) => void;
}

export const FriendshipCTA: React.FC<FriendshipCTAProps> = ({
  userId,
  status: initialStatus,
  onStatusChange,
}) => {
  const [currentStatus, setCurrentStatus] = useState<FriendshipStatus>(initialStatus);
  const [isMutating, setIsMutating] = useState(false);

  useEffect(() => {
    setCurrentStatus(initialStatus);
    setIsMutating(false);
  }, [userId, initialStatus]);

  const handleSend = async () => {
    setIsMutating(true);
    try {
      const next = await sendFriendRequest(userId);
      setCurrentStatus(next);
      onStatusChange?.(next);
    } catch (err) {
      console.error('Failed to send friend request:', err);
    } finally {
      setIsMutating(false);
    }
  };

  const handleAccept = async () => {
    setIsMutating(true);
    try {
      const next = await acceptFriendRequest(userId);
      setCurrentStatus(next);
      onStatusChange?.(next);
    } catch (err) {
      console.error('Failed to accept friend request:', err);
    } finally {
      setIsMutating(false);
    }
  };

  const handleDecline = async () => {
    setIsMutating(true);
    try {
      const next = await declineFriendRequest(userId);
      setCurrentStatus(next);
      onStatusChange?.(next);
    } catch (err) {
      console.error('Failed to decline friend request:', err);
    } finally {
      setIsMutating(false);
    }
  };

  const handleUnfriend = async () => {
    setIsMutating(true);
    try {
      const next = await cancelOrRemoveFriend(userId);
      setCurrentStatus(next);
      onStatusChange?.(next);
    } catch (err) {
      console.error('Failed to remove friend:', err);
    } finally {
      setIsMutating(false);
    }
  };

  const handleUnblock = async () => {
    setIsMutating(true);
    try {
      const next = await unblockUser(userId);
      setCurrentStatus(next);
      onStatusChange?.(next);
    } catch (err) {
      console.error('Failed to unblock user:', err);
    } finally {
      setIsMutating(false);
    }
  };

  if (currentStatus === 'BLOCKED_BY_OTHER') {
    return (
      <span className="help">
        Friendship unavailable
      </span>
    );
  }

  if (currentStatus === 'BLOCKED') {
    return (
      <div className="friendship-actions">
        <span className="friendship-badge friendship-badge--blocked">
          Blocked
        </span>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={handleUnblock}
          disabled={isMutating}
        >
          Unblock
        </button>
      </div>
    );
  }

  // Solicitud pendiente enviada: Badge informativa, sin botón Cancel
  if (currentStatus === 'PENDING_SENT') {
    return (
      <div className="friendship-actions">
        <span className="friendship-badge friendship-badge--pending">
          Request Sent
        </span>
      </div>
    );
  }

  // Solicitud recibida: Acciones de aceptar o rechazar
  if (currentStatus === 'PENDING_RECEIVED') {
    return (
      <div className="friendship-actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleAccept}
          disabled={isMutating}
        >
          Accept
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={handleDecline}
          disabled={isMutating}
        >
          Decline
        </button>
      </div>
    );
  }

  // Amistad activa: Badge confirmada y opción para deshacer amistad
  if (currentStatus === 'ACCEPTED') {
    return (
      <div className="friendship-actions">
        <span className="friendship-badge friendship-badge--friends">
          Friends ✓
        </span>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={handleUnfriend}
          disabled={isMutating}
        >
          Unfriend
        </button>
      </div>
    );
  }

  // Sin relación: Botón para mandar solicitud
  return (
    <div className="friendship-actions">
      <button
        type="button"
        className="btn btn--primary"
        onClick={handleSend}
        disabled={isMutating}
      >
        Add Friend
      </button>
    </div>
  );
};