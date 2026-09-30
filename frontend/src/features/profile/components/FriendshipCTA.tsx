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
    } finally {
      setIsMutating(false);
    }
  };

  const handleCancel = async () => {
    setIsMutating(true);
    try {
      const next = await cancelOrRemoveFriend(userId);
      setCurrentStatus(next);
      onStatusChange?.(next);
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
    } finally {
      setIsMutating(false);
    }
  };

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

  if (currentStatus === 'PENDING_SENT') {
    return (
      <div className="friendship-actions">
        <span className="friendship-badge friendship-badge--pending">
          Request Sent
        </span>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={handleCancel}
          disabled={isMutating}
        >
          Cancel
        </button>
      </div>
    );
  }

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

  if (currentStatus === 'ACCEPTED') {
    return (
      <div className="friendship-actions">
        <span className="friendship-badge friendship-badge--friends">
          Friends ✓
        </span>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={handleCancel}
          disabled={isMutating}
        >
          Unfriend
        </button>
      </div>
    );
  }

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