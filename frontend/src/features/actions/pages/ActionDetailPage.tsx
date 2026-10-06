import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { completeAction, approveAction, fetchAction } from '../api/actionsApi';
import type { Action, ActionDetailData, ActionParticipant } from '../types';
import { ActionComments } from '../components/ActionComments';
import { ActionDetailsView } from '../components/ActionDetailsView';
import { getPublicProfile } from '@/features/profile';
import type { PublicProfile } from '@/features/profile';
import { fetchOrganization } from '@/features/organizations/api/organizationsApi';
import type { Organization } from '@/features/organizations/types';
import { fetchActionParticipants, joinAction, leaveAction } from '@/features/participations/api/participationsApi';
import { getCurrentUserSummary } from '@/features/profile/api/profileApi';

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
  maxParticipants: action.max_participants ?? action.participant_count,

  currentParticipants: action.participant_count,

  images: action.imagesList ?? [],

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

export const ActionDetailPage: React.FC<ActionDetailPageProps> = ({ editPath }) => {
  
  const { id } = useParams<{ id: string }>();

  const [action, setAction] = useState<Action | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<PublicProfile | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const [organization, setOrganization] = useState<Organization | null>(null);

  const [participants, setParticipants] = useState<ActionParticipant[]>([]);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    setParticipants([]);
    setOrganization(null);
    setCreatorProfile(null);
    setError(null);
    setIsLoading(true);

    const controller = new AbortController();

    const loadAction = async () => {
      try {
        const currentUser = await getCurrentUserSummary();
        setCurrentUserId(currentUser.userId);

        const actionData = await fetchAction(id, controller.signal);
        setAction(actionData);

        const participantRows = await fetchActionParticipants(
          id,
          controller.signal,
        );

        setParticipants(
          participantRows.map((participant) => ({
            userId: participant.user_id,
            name: participant.username ?? `user-${participant.user_id}`,
            avatarUrl: participant.profile_picture ?? undefined,
          })),
        );

        const profile = await getPublicProfile(
          String(actionData.creator_id),
        );

        setCreatorProfile(profile);

        if (actionData.organization_id) {
          try {
            const organizationData = await fetchOrganization(
              String(actionData.organization_id),
              controller.signal,
            );

            setOrganization(organizationData);
          } catch (organizationError) {
            console.error(
              'Unable to load organization:',
              organizationError,
            );
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadAction();

    return () => controller.abort();
  }, [id]);

  const handleJoin = async () => {
    if (!id) return;

    await joinAction(id);

    const participantRows = await fetchActionParticipants(id);

    setParticipants(
      participantRows.map((participant) => ({
        userId: participant.user_id,
        name: participant.username ?? `user-${participant.user_id}`,
        avatarUrl: participant.profile_picture ?? undefined,
      })),
    );

    const updatedAction = await fetchAction(id);
    setAction(updatedAction);
  };

  const handleLeave = async () => {
    if (!id) return;

    await leaveAction(id);

    const participantRows = await fetchActionParticipants(id);

    setParticipants(
      participantRows.map((participant) => ({
        userId: participant.user_id,
        name: participant.username ?? `user-${participant.user_id}`,
        avatarUrl: participant.profile_picture ?? undefined,
      })),
    );

    const updatedAction = await fetchAction(id);
    setAction(updatedAction);
  };

  const handleApprove = async () => {
    if (!id) return;

    await approveAction(id);

    const updatedAction = await fetchAction(id);
    setAction(updatedAction);
  };

  const handleComplete = async () => {
    if (!id) return;

    await completeAction(id);

    const updatedAction = await fetchAction(id);
    setAction(updatedAction);
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--s4)' }}>
        Loading action details...
      </div>
    );
  }

  if (error || !action) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--s4)' }}>
        <h2>Action not found</h2>
        <p>We could not retrieve the requested action.</p>
      </div>
    );
  }

  const isCreator = currentUserId !== null && action.creator_id === currentUserId;

  const canEdit = isCreator && action.status === 'PENDING';

  const canApprove = isCreator && action.status === 'PENDING' &&
  action.participant_count >= (action.min_participants ?? 0);
  
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