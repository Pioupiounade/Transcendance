export interface FriendUserSummary {
  user_id: string;
  username: string | null;
  profile_picture: string | null;
  status: 'ACTIVE' | 'BLOCKED';
  created_at: string;
}

export interface FriendRequestItem {
  friend_request_id: string;
  requester_id: string;
  addressee_id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  created_at: string;
  user: {
    user_id: string;
    username: string | null;
    profile_picture: string | null;
  };
}