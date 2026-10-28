import { useState, useEffect, useCallback, useRef } from 'react';
import { friendsApi } from './friendsApi';
import type { FriendUserSummary, FriendRequestItem } from '../types';

export function useSocialManagement() {
  const [friends, setFriends] = useState<FriendUserSummary[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequestItem[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockedFriends, setBlockedFriends] = useState<FriendUserSummary[]>([]);

  const requestVersion = useRef(0);

  const fetchAll = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    try {
     const [friendsData, blockedData, receivedData, sentData] = await Promise.all([
      friendsApi.getMyFriends(),
      friendsApi.getBlockedFriends(),
      friendsApi.getReceivedRequests(),
      friendsApi.getSentRequests(),
    ]);

    if (version !== requestVersion.current) return;
    setFriends(friendsData);
    setBlockedFriends(blockedData);
    setReceivedRequests(receivedData);
    setSentRequests(sentData);
    } catch (err: any) {
      if (version === requestVersion.current) {
        setError(err?.message || 'Error loading social connections');
      }
    } finally {
      if (version === requestVersion.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchAll();

    const handleFriendshipChanged = () => {
      void fetchAll();
    };

    window.addEventListener('friendship:changed', handleFriendshipChanged);
    window.addEventListener('user:deleted', handleFriendshipChanged);
  
    return () => {
      window.removeEventListener('friendship:changed', handleFriendshipChanged);
      ++requestVersion.current;
      window.removeEventListener('user:deleted', handleFriendshipChanged);
    };
  }, [fetchAll]);

  const handleAcceptRequest = async (requestId: string) => {
    await friendsApi.acceptFriendRequest(requestId);
    await fetchAll();
  };

  const handleRejectRequest = async (requestId: string) => {
    await friendsApi.rejectFriendRequest(requestId);
    setReceivedRequests((prev) => prev.filter((r) => r.friend_request_id !== requestId));
  };

  const handleRemoveFriend = async (friendUserId: string) => {
    await friendsApi.removeFriend(friendUserId);
    setFriends((prev) => prev.filter((f) => f.user_id !== friendUserId));
  };

  const handleBlockFriend = async (friendUserId: string) => {
    await friendsApi.blockFriend(friendUserId);
    await fetchAll();
  };

  const handleUnblockFriend = async (friendUserId: string) => {
    await friendsApi.unblockFriend(friendUserId);
    await fetchAll();
  };

  return {
    friends,
    receivedRequests,
    sentRequests,
    loading,
    error,
    blockedFriends,
    refresh: fetchAll,
    acceptRequest: handleAcceptRequest,
    rejectRequest: handleRejectRequest,
    removeFriend: handleRemoveFriend,
    blockFriend: handleBlockFriend,
    unblockFriend: handleUnblockFriend,
  };
}