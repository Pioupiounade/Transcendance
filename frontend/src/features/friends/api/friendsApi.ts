import { http } from '@/shared/api/http';
import type { FriendUserSummary, FriendRequestItem } from '../types';

export const friendsApi = {
  // Directorio y amistades (#66)
  getMyFriends: (signal?: AbortSignal) =>
    http.get<FriendUserSummary[]>('/friendships/me', { signal }),

  getBlockedFriends: (signal?: AbortSignal) =>
    http.get<FriendUserSummary[]>('/friendships/me/blocked', { signal }),

  removeFriend: (friendUserId: string) =>
    http.delete<void>(`/friendships/${friendUserId}`),

  blockFriend: (friendUserId: string) =>
    http.patch<void>(`/friendships/${friendUserId}/block`, {}),

  unblockFriend: (friendUserId: string) =>
    http.patch<void>(`/friendships/${friendUserId}/unblock`, {}),

  // Bandeja de solicitudes (#68)
  getReceivedRequests: (signal?: AbortSignal) =>
    http.get<FriendRequestItem[]>('/friend-requests/receivedRequests', { signal }),

  getSentRequests: (signal?: AbortSignal) =>
    http.get<FriendRequestItem[]>('/friend-requests/sentRequests', { signal }),

  sendFriendRequest: (addresseeId: string) =>
    http.patch<void>('/friend-requests/me/send', { addressee_id: addresseeId }),

  acceptFriendRequest: (requestId: string) =>
    http.patch<void>(`/friend-requests/${requestId}/accept`, {}),

  rejectFriendRequest: (requestId: string) =>
    http.patch<void>(`/friend-requests/${requestId}/reject`, {}),
};