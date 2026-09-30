// D'après docs/api_contract.md §2 (enums) et §3 (forme `Action`).
export const CATEGORY = { ENVIRONMENT: 'ENVIRONMENT', SOCIAL: 'SOCIAL', CULTURAL: 'CULTURAL' } as const;
export type Category = (typeof CATEGORY)[keyof typeof CATEGORY];
export interface ActionParticipant{
  userId: string;
  name: string;
  avatarUrl?: string;
}
export const ACTION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  COMPLETED: 'COMPLETED',
} as const;
export type ActionStatus = (typeof ACTION_STATUS)[keyof typeof ACTION_STATUS];

/** `[latitude, longitude]`, l'ordre du backend et de Leaflet. */
export type LatLng = [latitude: number, longitude: number];

export type Action = {
  action_id: string;
  title: string;
  description: string;
  creator_id: string;
  organization_id: string | null;
  min_participants: number | null;
  max_participants: number | null;
  location: LatLng;
  status: ActionStatus;
  category: Category;
  imagesList: string[];
  validated_by_user_id: string | null;
  validated_at: string | null;
  scheduled_at: string;
  created_at: string;
  updated_at: string;
  /** Calculés par l'API sur `GET /actions` et `GET /actions/:id` (absents des réponses de POST/PATCH/approve/cancel/complete). */
  participant_count: number;
  /** `null` = pas de plafond (`max_participants` null). */
  remaining_seats: number | null;
};

/** Action telle que la renvoient les mutations (`POST /actions`, `PATCH`, `approve`, `cancel`, `complete`) : sans les champs calculés. */
export type ActionRecord = Omit<Action, 'participant_count' | 'remaining_seats'>;

/** Commentaire public d'une action (`GET`/`POST /actions/:id/comments`, §15) ; `profile` null = auteur sans profil. */
export type ActionComment = {
  comment_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  action_id: string;
  user: { user_id: string; profile: { username: string; profile_picture: string | null } | null };
};

/** Statuts visibles sur la carte et dans les listes publiques : à venir ou validées. */
export const OPEN_STATUSES: readonly ActionStatus[] = [ACTION_STATUS.PENDING, ACTION_STATUS.APPROVED];

// --- Détail d'action (#34) : forme du mock `api/actionDetailMock.ts`, en attendant l'alignement
// sur `Action` ci-dessus (l'API n'expose ni organisateur ni nombre de participants).
export type ActionDetailCategory = 'environment' | 'social' | 'cultural';
export type ActionDetailStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';

export type ActionOrganizer = {
  userId: string;
  name: string;
  avatarUrl?: string;
  organizationTitle?: string;
  organizationId?: string;
};

export type ActionDetailData = {
  id: string;
  title: string;
  description: string;
  category: ActionDetailCategory;
  status: ActionDetailStatus;
  locationName: string;
  scheduledAt: string;
  minParticipants: number;
  maxParticipants: number;
  currentParticipants: number;
  /** URLs des photos (5 max). */
  images: string[];
  organizer: ActionOrganizer;
  validatedByUserId?: string;
  validatedAt?: string;
  organizationId?: string;
  participants?:ActionParticipant[];
  isJoined?: boolean;
};
