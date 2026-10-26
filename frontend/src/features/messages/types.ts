/** Élément de `GET /direct-messages/:friendId` (docs/api_contract.md §18) ; les ids sont des chaînes numériques. */
export type DirectMessage = {
  message_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
};

/** Limite du backend (`CreateDirectMessageDto`, 280 caractères) ; au-delà, 400. */
export const MESSAGE_MAX_LENGTH = 280;
