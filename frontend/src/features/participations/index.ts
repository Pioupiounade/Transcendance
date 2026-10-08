// Interface de la feature participations (Epic 3) : mes participations, le groupe d'une action, rejoindre / quitter.
export { useMyParticipations } from './api/useMyParticipations';
export { fetchActionParticipants, joinAction, leaveAction } from './api/participationsApi';
export type { ActionParticipantApi } from './api/participationsApi';
export type { MyParticipation } from './types';
