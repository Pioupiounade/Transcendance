// Interface de la feature messages : page `/messages[/:friendId]`, pastille de l'en-tête, types.
export { MessagesPage } from './pages/MessagesPage';
export { MessagesButton } from './components/MessagesButton';
export { useUnreadMessages } from './api/useUnreadMessages';
export type { DirectMessage } from './types';
export { MESSAGE_MAX_LENGTH } from './types';
