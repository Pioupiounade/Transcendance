// D'après docs/api_contract.md §2 (enums) et §3 (forme `Action`).
export const CATEGORY = { ENVIRONMENT: 'ENVIRONMENT', SOCIAL: 'SOCIAL', CULTURAL: 'CULTURAL' } as const;
export type Category = (typeof CATEGORY)[keyof typeof CATEGORY];

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
};

/** Statuts visibles sur la carte et dans les listes publiques : à venir ou validées. */
export const OPEN_STATUSES: readonly ActionStatus[] = [ACTION_STATUS.PENDING, ACTION_STATUS.APPROVED];
