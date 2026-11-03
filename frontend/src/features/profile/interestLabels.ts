import type { IconName } from '@/shared/ui';
import type { InterestCategory } from './types';

export const INTEREST_LABELS: Record<InterestCategory, string> = {
  ENV_FLOWER_POWER: 'Flower planting',
  ENV_CLEAN: 'Clean-up',
  ENV_DO: 'Environmental action',
  SOCIAL_SHARE: 'Sharing',
  SOCIAL_MEET: 'Meeting people',
  SOCIAL_DO: 'Social action',
  CULTURAL_LEARN: 'Cultural discovery',
  CULTURAL_CREATE: 'Cultural creation',
  CULTURAL_DO: 'Cultural activities',
};

/** Les trois familles d'intérêts, miroir des catégories d'action (mêmes teintes, mêmes icônes). */
export type InterestFamily = 'environment' | 'social' | 'cultural';

export const INTEREST_FAMILIES: readonly InterestFamily[] = ['environment', 'social', 'cultural'];

export const INTEREST_FAMILY: Record<InterestCategory, InterestFamily> = {
  ENV_FLOWER_POWER: 'environment',
  ENV_CLEAN: 'environment',
  ENV_DO: 'environment',
  SOCIAL_SHARE: 'social',
  SOCIAL_MEET: 'social',
  SOCIAL_DO: 'social',
  CULTURAL_LEARN: 'cultural',
  CULTURAL_CREATE: 'cultural',
  CULTURAL_DO: 'cultural',
};

/* Libellés des catégories ; `features/actions` les possède mais importe déjà `profile` :
   les répéter ici évite un cycle. */
export const INTEREST_FAMILY_LABELS: Record<InterestFamily, string> = {
  environment: 'Environment',
  social: 'Mutual aid',
  cultural: 'Culture & sharing',
};

export const INTEREST_FAMILY_ICONS: Record<InterestFamily, IconName> = {
  environment: 'leaf',
  social: 'heart',
  cultural: 'sun',
};

export const INTERESTS_BY_FAMILY: Record<InterestFamily, readonly InterestCategory[]> = {
  environment: ['ENV_FLOWER_POWER', 'ENV_CLEAN', 'ENV_DO'],
  social: ['SOCIAL_SHARE', 'SOCIAL_MEET', 'SOCIAL_DO'],
  cultural: ['CULTURAL_LEARN', 'CULTURAL_CREATE', 'CULTURAL_DO'],
};
