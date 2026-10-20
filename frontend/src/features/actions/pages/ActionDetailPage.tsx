import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '@/features/auth';
import type { Organization } from '@/features/organizations';
import { fetchActionParticipants, joinAction, leaveAction, type ActionParticipantApi } from '@/features/participations';
import { getPublicProfile, isUnavailablePublicProfile, type PublicProfile } from '@/features/profile';
import { fetchActionOrganization } from '../api/actionOrganizations';
import { approveAction, completeAction, fetchAction } from '../api/actionsApi';
import { ActionComments } from '../components/ActionComments';
import { ActionDetailsView } from '../components/ActionDetailsView';
import type { Action, ActionDetailData, ActionParticipant } from '../types';

const toActionDetailData = (
action: Action,
creatorProfile: PublicProfile | null,
organization: Organization | null,
participants: ActionParticipant[],
currentUserId: string | null): ActionDetailData => ({
  id: action.action_id,
  title: action.title,
  description: action.description,
  isJoined:
  currentUserId !== null &&
  participants.some((participant) => participant.userId === currentUserId),
  
  category: action.category.toLowerCase() as ActionDetailData['category'],
  status: action.status.toLowerCase() as ActionDetailData['status'],

  locationName: `${action.location[0]}, ${action.location[1]}`,

  scheduledAt: action.scheduled_at,

  minParticipants: action.min_participants ?? 0,
  maxParticipants: action.max_participants,
  currentParticipants: action.participant_count,

  images: [...action.images_before, ...action.images_after],

  organizer: {
    userId: action.creator_id,
    name: creatorProfile?.username ?? `user-${action.creator_id}`,
    avatarUrl: creatorProfile?.profilePicture ?? undefined,
    organizationTitle: organization?.title,
    organizationId: action.organization_id ?? undefined,
  },

    validatedByUserId: action.validated_by_user_id ?? undefined,
    validatedAt: action.validated_at ?? undefined,
    organizationId: action.organization_id ?? undefined,

    participants,
  });

type ActionDetailPageProps = { editPath: (id: string) => string; };

type Detail = {
  action: Action;
  participants: ActionParticipant[];
  creatorProfile: PublicProfile | null;
  organization: Organization | null;
};

/** Dernier chargement, étiqueté par l'id de la route : un autre id = en chargement, sans remise à zéro manuelle. */
type Loaded = { id: string; detail: Detail | null };

const toParticipants = (rows: ActionParticipantApi[]): ActionParticipant[] =>
  rows.map((participant) => ({
    userId: participant.user_id,
    name: participant.username ?? `user-${participant.user_id}`,
    avatarUrl: participant.profile_picture ?? undefined,
  }));

// Tout ce que la fiche affiche. Le profil du créateur (404 s'il est privé) et l'organisation sont facultatifs :
// leur échec ne cache pas l'action.
const loadDetail = async (
  id: string,
  signal: AbortSignal,
): Promise<Detail | null> => {
  const action = await fetchAction(id, signal);

  if (action === null) {
    return null;
  }

  const [participantRows, creatorProfileResult, organization] =
    await Promise.all([
      fetchActionParticipants(id, signal),
      getPublicProfile(action.creator_id).catch(() => null),
      action.organization_id === null
        ? null
        : fetchActionOrganization(
            action.organization_id,
            signal,
          ).catch(() => null),
    ]);

  const creatorProfile =
    creatorProfileResult &&
    isUnavailablePublicProfile(creatorProfileResult)
      ? null
      : creatorProfileResult;

  return {
    action,
    participants: toParticipants(participantRows),
    creatorProfile,
    organization,
  };
};

export const ActionDetailPage: React.FC<ActionDetailPageProps> = ({ editPath }) => {
  const { id } = useParams<{ id: string }>();

  const { status, user } = useAuth();
  const currentUserId = status === 'authenticated' ? (user?.user_id ?? null) : null;
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    loadDetail(id, controller.signal)
      .then((detail) => setLoaded({ id, detail }))
      .catch(() => {
        if (!controller.signal.aborted) setLoaded({ id, detail: null });
      });
    return () => controller.abort();
  }, [id]);

  const current = loaded !== null && loaded.id === id ? loaded : null;
  const isLoading = id !== undefined && current === null;
  const detail = current?.detail ?? null;

  // Après rejoindre / quitter / approuver / terminer : relit l'action (statut, compteurs) et, s'il a changé, le
  // groupe des participants ; le reste de la fiche ne bouge pas.
  const refresh = async (actionId: string, withParticipants: boolean) => {
    const action = await fetchAction(actionId);

    if (action === null) {
      setLoaded((previous) =>
        previous?.id === actionId
          ? { id: actionId, detail: null }
          : previous,
      );
      return;
    }

    const participants = withParticipants
      ? toParticipants(await fetchActionParticipants(actionId))
      : null;

    setLoaded((previous) =>
      previous?.detail && previous.id === actionId
        ? {
            id: actionId,
            detail: {
              ...previous.detail,
              action,
              participants: participants ?? previous.detail.participants,
            },
          }
        : previous,
    );
  };

  const handleJoin = async () => {
    if (!id) return;
    await joinAction(id);
    await refresh(id, true);
  };

  const handleLeave = async () => {
    if (!id) return;
    await leaveAction(id);
    await refresh(id, true);
  };

  const handleApprove = async () => {
    if (!id) return;
    await approveAction(id);
    await refresh(id, false);
  };

  const handleComplete = async () => {
    if (!id) return;
    await completeAction(id);
    await refresh(id, false);
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--s4)' }}>
        Loading action details...
      </div>
    );
  }

  if (!detail) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--s4)' }}>
        <h2>Action not found</h2>
        <p>We could not retrieve the requested action.</p>
      </div>
    );
  }

  const { action, creatorProfile, organization, participants } = detail;

  const isCreator = currentUserId !== null && action.creator_id === currentUserId;

  const canEdit = isCreator && action.status === 'PENDING';
  const approvableParticipantCount = participants.filter((participant) => participant.userId !== action.creator_id).length;

  const canApprove = isCreator && action.status === 'PENDING' &&
  approvableParticipantCount >= (action.min_participants ?? 0);
  
  const canComplete = isCreator && action.status === 'APPROVED';
  
  const canComment = currentUserId !== null &&
  (
    action.creator_id === currentUserId ||
    participants.some(
      (participant) => participant.userId === currentUserId,
    )
  );

  return (
    <>
      <ActionDetailsView
        action={toActionDetailData(
          action,
          creatorProfile,
          organization,
          participants,
          currentUserId,
        )}
        currentUserId={currentUserId}
        onJoin={handleJoin}
        onLeave={handleLeave}
        onEdit={
          canEdit
           ? () => navigate(editPath(action.action_id))
           : undefined
        }
        onApprove={canApprove ? handleApprove : undefined}
        onComplete={canComplete ? handleComplete : undefined}
      />
      <ActionComments
        actionId={action.action_id}
        canComment={canComment}
      />
    </>
  );
};