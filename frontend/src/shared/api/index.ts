// Interface du client HTTP. Voir frontend/CLAUDE.md, « Modules deep de référence ».
export { http, type RequestOptions } from './http';
export { ApiError, isApiError } from './ApiError';
export { session, type SessionTokens } from './session';
