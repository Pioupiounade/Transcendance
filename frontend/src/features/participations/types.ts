import type { ActionStatus, Category } from '@/features/actions';

/** Ligne de `GET /participations/me` (docs/api_contract.md §3) : l'action rejointe, sans lieu ni compteurs. */
export type MyParticipation = {
  action_id: string;
  title: string;
  description: string;
  status: ActionStatus;
  category: Category;
  scheduled_at: string;
  created_at: string;
  organization_id: string | null;
};
