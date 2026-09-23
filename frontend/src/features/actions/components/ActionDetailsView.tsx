import React, { useState } from 'react';
import type { ActionDetailData } from '../types';
import './ActionDetailsView.css';
import { Avatar, Button } from '../../../shared/ui';

interface ActionDetailsViewProps {
  /** Action data to be displayed */
  action: ActionDetailData;
}

/**
 * Detailed view for a single action.
 *
 * Renders header chips, organizer information, an interactive photo carousel,
 * logistics details, description text, and a participation block.
 */
export const ActionDetailsView: React.FC<ActionDetailsViewProps> = ({
  action,
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
    currentParticipants,
    images,
    organizer,
    validatedAt,
  } = action;

  // Carousel state
  const [currentIndex, setCurrentIndex] = useState(0);
  const hasImages = images && images.length > 0;

  const prevImage = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const nextImage = () => {
    setCurrentIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  // Format the scheduled date for display
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(scheduledAt));

  // Participation calculations
  const availableSpots = maxParticipants - currentParticipants;
  const canJoin = status === 'approved' && availableSpots > 0;

  return (
    <div className="action-details-card">
      {/* Header chips and verification badge */}
      <div className="action-header">
        <span className="chip">{category}</span>
        <span className="chip">{status}</span>
        {status === 'approved' && validatedAt && (
          <span className="chip chip--verified">✓ Action verified</span>
        )}
      </div>

      {/* Title */}
      <h2 className="action-title">{title}</h2>

      {/* Organizer row */}
      <div className="organizer-row">
        <Avatar src={organizer.avatarUrl} alt={organizer.name} size="md" />
        <span className="organizer-name">{organizer.name}</span>
      </div>

      {/* Photo carousel */}
      {hasImages && (
        <div className="carousel">
          <img
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1}`}
            className="carousel-img"
          />
          <button
            type="button"
            className="carousel-btn prev"
            onClick={prevImage}
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            type="button"
            className="carousel-btn next"
            onClick={nextImage}
            aria-label="Next image"
          >
            ›
          </button>
          <div className="carousel-counter">
            {currentIndex + 1} / {images.length}
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

      {/* Logistics panel */}
      <div className="panel logistics">
        <div>
          <strong>Location:</strong> {locationName}
        </div>
        <div>
          <strong>Date:</strong> {formattedDate}
        </div>
        <div>
          <strong>Available spots:</strong> {availableSpots} / {maxParticipants}
        </div>
      </div>

      {/* Description */}
      <div className="description">{description}</div>

      {/* Participation block */}
      <div className="panel participation">
        <span>{availableSpots} seats available</span>
        <Button disabled={!canJoin}>Join</Button>
      </div>
    </div>
  );
};
