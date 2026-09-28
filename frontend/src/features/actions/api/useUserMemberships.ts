import { useEffect, useState } from 'react';
import { http } from '@/shared/api';
import type { UserOrgMembership } from '../permissions';

export function useUserMemberships(userId: string | null) {
  const [memberships, setMemberships] = useState<UserOrgMembership[]>([]);

  useEffect(() => {
    if (userId === null) {
      setMemberships([]);
      return;
    }

    const controller = new AbortController();
    http
      .get<UserOrgMembership[]>(`/organization-members/user/${userId}/organizations`, { signal: controller.signal })
      .then(setMemberships)
      .catch(() => {
        if (!controller.signal.aborted) setMemberships([]);
      });

    return () => controller.abort();
  }, [userId]);

  return memberships;
}