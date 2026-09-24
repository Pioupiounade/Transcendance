export type ProfileVisibility = 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';

export type InterestCategory =
  | 'ENV_FLOWER_POWER'
  | 'ENV_CLEAN'
  | 'ENV_DO'
  | 'SOCIAL_SHARE'
  | 'SOCIAL_MEET'
  | 'SOCIAL_DO'
  | 'CULTURAL_LEARN'
  | 'CULTURAL_CREATE'
  | 'CULTURAL_DO';
  
export interface UserProfile {
  username: string;
  location: { latitude: number; longitude: number } | null;
  description?: string;
  visibility: ProfileVisibility;
  profilePicture?: string;
  commune?: string | null;
}

export interface ProfileOrganization {
  id: string;
  title: string;
}

export interface ProfileParticipation {
  actionId: string;
  title: string;
}

export interface ProfileActivity {
  points: number;
  organizations: ProfileOrganization[];
  participations: ProfileParticipation[];
}

