export type ProfileVisibility = 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';

export interface UserProfile {
  id: string;
  username: string;
  location: { latitude: number; longitude: number } | null;
  description?: string;
  visibility: ProfileVisibility;
  profilePicture?: string;
}