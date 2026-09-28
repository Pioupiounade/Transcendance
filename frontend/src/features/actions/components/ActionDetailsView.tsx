import React, { useState } from 'react';
import { Link } from 'react-router';
import type { ActionDetailData, ActionParticipant } from '../types';
import './ActionDetailsView.css';
import { Avatar, Button } from '../../../shared/ui';

interface ActionDetailsViewProps {
  action: ActionDetailData;
  currentUser?: ActionParticipant;
  onJoin?: () => Promise<void> | void;
  onLeave?: () => Promise<void> | void;
}

export const ActionDetailsView: React.FC<ActionDetailsViewProps> = ({
  action,
  currentUser,
  onJoin,
  onLeave,
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
  const [participantsList, setParticipantsList] = useState<ActionParticipant[]>(participants);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const availableSpots = Math.max(0, maxParticipants - participantsCount);
  const isApproved = status === 'approved';
  const canJoin = isApproved && availableSpots > 0 && !isJoined;

  const activeUserId = currentUser?.userId ?? 'current-user';

  const handleToggleJoin = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (isJoined) {
        if (onLeave) await onLeave();
        setIsJoined(false);
        setParticipantsCount((prev) => Math.max(0, prev - 1));
        setParticipantsList((prev) => prev.filter((p) => p.userId !== activeUserId));
      } else {
        if (onJoin) await onJoin();
        setIsJoined(true);
        setParticipantsCount((prev) => prev + 1);
        if (currentUser) {
          setParticipantsList((prev) => [...prev, currentUser]);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="card">
        <div className="header">
          <span className="chip">{category}</span>
          <span className={`chip status-${status}`}>{status}</span>
          {status === 'approved' && validatedAt && (
            <span className="chip verified">✓ Action verified</span>
          )}
        </div>

        <h2>{title}</h2>

        <div className="organizer">
          <Link
            to={`/profile/${organizer.name}`}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Avatar src={organizer.avatarUrl} name={organizer.name} size={42} />
            <div className="organizer-info">
              <span className="organizer-name">@{organizer.name}</span>
              {organizer.organizationTitle && (
                <span className="text-muted">{organizer.organizationTitle}</span>
              )}
            </div>
          </Link>
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
            <strong>Participants:</strong> {participantsCount} / {maxParticipants} (min {minParticipants})
          </div>
        </div>

        <div className="description">
          <p>{description}</p>
        </div>

        <div className="participation">
          <div className="participation-spots">
            <strong>Available spots:</strong>{' '}
            <span className={availableSpots === 0 ? 'text-danger' : ''}>
              {availableSpots} remaining
            </span>
          </div>

          <div className="participation-actions">
            {isJoined ? (
              <Button
                variant="secondary"
                disabled={isSubmitting}
                onClick={handleToggleJoin}
              >
                {isSubmitting ? 'Updating...' : 'Leave Action'}
              </Button>
            ) : (
              <Button
                disabled={!canJoin || isSubmitting}
                onClick={handleToggleJoin}
              >
                {isSubmitting
                  ? 'Joining...'
                  : availableSpots === 0
                  ? 'Action Full'
                  : 'Join Action'}
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
                  to={`/profile/${participant.name}`}
                  title={participant.name}
                  style={{ textDecoration: 'none' }}
                >
                  <Avatar
                    src={participant.avatarUrl}
                    name={participant.name}
                    size={36}
                  />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};