export interface FriendUserSummary {
  user_id: string;
  username: string | null;
  profile_picture: string | null;
  status: 'ACTIVE' | 'BLOCKED';
  created_at: string;
}

export interface FriendRequestUser {
  user_id: string;
  username: string | null;
  profile_picture: string | null;
}

export interface FriendRequestItem {
  friend_request_id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  created_at: string;
  requester?: FriendRequestUser;
  addressee?: FriendRequestUser;
}