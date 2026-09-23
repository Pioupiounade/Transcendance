/** Erreur normalisée du client HTTP. `status` 0 = réseau injoignable. */
export class ApiError extends Error {
  readonly status: number;
  /** Messages du backend (`message` NestJS, string ou tableau), vides pour une erreur réseau. */
  readonly messages: readonly string[];

  constructor(status: number, messages: readonly string[]) {
    super(messages[0] ?? `HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.messages = messages;
  }

  get isNetwork(): boolean {
    return this.status === 0;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;
