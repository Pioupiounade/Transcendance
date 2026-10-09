// Gestes de modération proposés par chaque section ; les libellés et les requêtes sont indexés par ces clés.
export type AccountActionKind = 'block' | 'unblock';
export type ActionModerationKind = 'approve' | 'hide';
export type OrganizationModerationKind = 'suspend' | 'close' | 'reactivate';
