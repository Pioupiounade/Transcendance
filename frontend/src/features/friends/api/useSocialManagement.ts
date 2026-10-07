import { useState, useEffect, useCallback } from 'react';
import { friendsApi } from './friendsApi';
import type { FriendUserSummary, FriendRequestItem } from '../types';

export function useSocialManagement() {
  const [friends, setFriends] = useState<FriendUserSummary[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequestItem[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [friendsData, receivedData, sentData] = await Promise.all([
        friendsApi.getMyFriends(),
        friendsApi.getReceivedRequests(),
        friendsApi.getSentRequests(),
      ]);
      setFriends(friendsData);
      setReceivedRequests(receivedData);
      setSentRequests(sentData);
    } catch (err: any) {
      setError(err?.message || 'Error loading social connections');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
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
    setFriends((prev) => prev.filter((f) => f.user_id !== friendUserId));
  };

  return {
    friends,
    receivedRequests,
    sentRequests,
    loading,
    error,
    refresh: fetchAll,
    acceptRequest: handleAcceptRequest,
    rejectRequest: handleRejectRequest,
    removeFriend: handleRemoveFriend,
    blockFriend: handleBlockFriend,
  };
}