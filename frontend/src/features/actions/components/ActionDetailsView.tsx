import React, { useState } from 'react';
import { Link } from 'react-router';
import type { ActionDetailData, ActionParticipant } from '../types';
import './ActionDetailsView.css';
import { Avatar, Button } from '../../../shared/ui';
import { toActionErrorMessage } from '../errors';

interface ActionDetailsViewProps {
  action: ActionDetailData;
  currentUser?: ActionParticipant;
  currentUserId?: string | null;
  onJoin?: () => Promise<void> | void;
  onLeave?: () => Promise<void> | void;
  onEdit?: () => void;
  onApprove?: () => Promise<void> | void;
  onComplete?: () => Promise<void> | void;
}

export const ActionDetailsView: React.FC<ActionDetailsViewProps> = ({
  action,
  currentUserId,
  onJoin,
  onLeave,
  onEdit,
  onApprove,
  onComplete,
}) => {
  const {
    title,
    description,
    category,
    status,
    locationName,
    scheduledAt,
    minParticipants,
    maxParticipants,
    images,
    organizer,
    validatedAt,
    participants = [],
  } = action;

  const [currentIndex, setCurrentIndex] = useState(0);
  const totalImages = images?.length || 0;

  const [isJoined, setIsJoined] = useState<boolean>(action.isJoined ?? false);
  const [participantsCount, setParticipantsCount] = useState<number>(
    action.currentParticipants
  );
  // La liste vient du parent, qui la relit après chaque rejoindre / quitter : pas d'état miroir.
  const participantsList = participants;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const prevImage = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
  };

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(scheduledAt));

  const hasParticipantLimit = maxParticipants !== null;

  const availableSpots = hasParticipantLimit
    ? Math.max(0, maxParticipants - participantsCount)
    : null;

  const isPending = status === 'pending';

  const isCreator =
    currentUserId !== null &&
    currentUserId !== undefined &&
    String(currentUserId) === String(organizer.userId);

  const canJoin =
    currentUserId !== null &&
    isPending &&
    !isCreator &&
    !isJoined &&
    (!hasParticipantLimit || (availableSpots !== null && availableSpots > 0));

  const canLeave =
    isPending &&
    !isCreator &&
    isJoined;

  const handleToggleJoin = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setActionError(null);

    try {
      if (isJoined) {
        if (onLeave) await onLeave();
        setIsJoined(false);
        setParticipantsCount((prev) => Math.max(0, prev - 1));
      } else {
        if (onJoin) await onJoin();
        setIsJoined(true);
        setParticipantsCount((prev) => prev + 1);
      }
    } catch (error) {
      setActionError(toActionErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusAction = async (actionHandler: (() => Promise<void> | void) | undefined) => {
    if (!actionHandler || statusSubmitting) return;
    setStatusSubmitting(true);
    setActionError(null);
    try {
      await actionHandler();
    } catch (error) {
      setActionError(toActionErrorMessage(error));
    } finally {
      setStatusSubmitting(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="card">
        <div
          className="header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div>
            <span className="chip">{category}</span>
            <span className={`chip status-${status}`}>{status}</span>

            {status === 'approved' && validatedAt && (
              <span className="chip verified">✓ Action verified</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {onApprove && (
              <Button disabled={statusSubmitting} loading={statusSubmitting} onClick={() => handleStatusAction(onApprove)}>
                Approve Action
              </Button>
            )}
            {onComplete && (
              <Button disabled={statusSubmitting} loading={statusSubmitting} onClick={() => handleStatusAction(onComplete)}>
                Complete Action
              </Button>
            )}
            {onEdit && (
              <Button onClick={onEdit}>
                Edit Action
              </Button>
            )}
          </div>
        </div>
        {actionError && (
          <p role="alert" style={{ color: 'var(--danger, #b93832)' }}>
            {actionError}
          </p>
        )}
        <h2>{title}</h2>
        <div className="organizer" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to={
              currentUserId && String(currentUserId) === String(organizer.userId)
                ? '/profile'
                : `/profiles/${organizer.userId}`
            }
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Avatar src={organizer.avatarUrl} name={organizer.name} size={42} />
            <span className="organizer-label">@{organizer.name}</span>
          </Link>

          {organizer.organizationTitle && organizer.organizationId && (
            <div className="organizer-info" style={{ marginLeft: 'auto' }}>
              <Link
                to={`/organizations/${organizer.organizationId}`}
                className="text-muted"
                style={{ textDecoration: 'none' }}
              >
                {organizer.organizationTitle}
              </Link>
            </div>
          )}
        </div>
        {totalImages > 0 && (
          <div className="carousel">
            <div className="carousel-main">
              <button
                type="button"
                className="carousel-control prev"
                onClick={prevImage}
                aria-label="Previous image"
              >
                ‹
              </button>
              <img
                src={images[currentIndex]}
                alt={`Image ${currentIndex + 1}`}
                className="carousel-image"
              />
              <button
                type="button"
                className="carousel-control next"
                onClick={nextImage}
                aria-label="Next image"
              >
                ›
              </button>
            </div>

            <div className="carousel-counter">
              {currentIndex + 1} / {totalImages}
            </div>

            <div className="carousel-thumbnails">
              {images.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`Thumbnail ${idx + 1}`}
                  className={`thumbnail ${idx === currentIndex ? 'active' : ''}`}
                  onClick={() => setCurrentIndex(idx)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="logistics">
          <div>
            <strong>Location:</strong> {locationName}
          </div>
          <div>
            <strong>Date:</strong> {formattedDate}
          </div>
          <div>
            <strong>Participants:</strong> {participantsCount} / {maxParticipants ?? 'Unlimited'} (min{' '}
            {minParticipants})
          </div>
        </div>

        <div className="description">
          <p>{description}</p>
        </div>

        <div className="participation">
          <div className="participation-spots">
            <strong>Available spots:</strong>{' '}
            <span className={availableSpots === 0 ? 'text-danger' : ''}>
              {availableSpots === null ? 'Unlimited' : `${availableSpots} remaining`}
            </span>
          </div>

          <div className="participation-actions">
            {canLeave && (
              <Button variant="secondary" disabled={isSubmitting} onClick={handleToggleJoin}>
                {isSubmitting ? 'Updating...' : 'Leave Action'}
              </Button>
            )}

            {canJoin && (
              <Button disabled={isSubmitting} onClick={handleToggleJoin}>
                {isSubmitting ? 'Joining...' : 'Join Action'}
              </Button>
            )}
          </div>
        </div>

        {participantsList.length > 0 && (
          <div
            className="participants-section"
            style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid var(--line, #e2e8f0)',
            }}
          >
            <h4 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>
              Confirmed Participants ({participantsList.length})
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              {participantsList.map((participant) => (
                <Link
                  key={participant.userId}
                  to={
                    currentUserId && String(currentUserId) === String(participant.userId)
                      ? '/profile'
                      : `/profiles/${participant.userId}`
                  }
                  title={participant.name}
                  style={{ textDecoration: 'none' }}
                >
                  <Avatar src={participant.avatarUrl} name={participant.name} size={36} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};