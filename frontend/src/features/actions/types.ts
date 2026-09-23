/**
 * Represents the category of an action.
 *
 * @typedef {'environment' | 'social' | 'cultural'} ActionCategory
 */
export type ActionCategory = 'environment' | 'social' | 'cultural';

/**
 * Represents the current status of an action.
 *
 * @typedef {'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'} ActionStatus
 *
 * Note: The value **'cancelled'** is spelled with a double “l”.
 */
export type ActionStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled';

/**
 * Information about the organizer of an action.
 *
 * @interface ActionOrganizer
 */
export interface ActionOrganizer {
  /** Unique identifier of the user who organizes the action. */
  userId: string;

  /** Display name of the organizer. */
  name: string;

  /** URL of the organizer's avatar image (optional). */
  avatarUrl?: string;

  /** Title of the organization the organizer belongs to (optional). */
  organizationTitle?: string;

  /** Identifier of the organization (optional). */
  organizationId?: string;
}

/**
 * Detailed data for an action.
 *
 * @interface ActionDetailData
 */
export interface ActionDetailData {
  /** Unique identifier of the action. */
  id: string;

  /** Title of the action. */
  title: string;

  /** Full description of the action. */
  description: string;

  /** Category of the action. */
  category: ActionCategory;

  /** Current status of the action. */
  status: ActionStatus;

  /** Human‑readable name of the location where the action takes place. */
  locationName: string;

  /** Scheduled date and time in ISO‑8601 format. */
  scheduledAt: string;

  /** Minimum number of participants required. */
  minParticipants: number;

  /** Maximum number of participants allowed. */
  maxParticipants: number;

  /** Current number of participants signed up. */
  currentParticipants: number;

  /** Array of image URLs (up to 5 photos). */
  images: string[];

  /** Organizer information. */
  organizer: ActionOrganizer;

  /** Identifier of the user who validated the action (optional). */
  validatedByUserId?: string;

  /** Timestamp when the action was validated, in ISO‑8601 format (optional). */
  validatedAt?: string;

  /** Identifier of the organization associated with the action (optional). */
  organizationId?: string;
}
