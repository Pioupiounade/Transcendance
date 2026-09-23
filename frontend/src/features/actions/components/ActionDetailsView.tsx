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
 */
export const ActionDetailsView: React.FC<ActionDetailsViewProps> = ({ action }) => {
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
  const totalImages = images?.length || 0;

  const prevImage = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
  };

  const nextImage = () => {
    setCurrentIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
  };

  // Format the scheduled date for display
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(scheduledAt));

  // Participation calculations
  const availableSpots = maxParticipants - currentParticipants;
  const canJoin = status === 'approved' && availableSpots > 0;

  return (
    <div className="dashboard">
      <div className="card">
        {/* Header chips con badges contrastados */}
        <div className="header">
          <span className="chip">{category}</span>
          <span className={`chip status-${status}`}>{status}</span>
          {status === 'approved' && validatedAt && (
            <span className="chip verified">✓ Action verified</span>
          )}
        </div>

        {/* Title */}
        <h2>{title}</h2>

        {/* Organizer row usando el componente Avatar oficial */}
        <div className="organizer">
          <Avatar src={organizer.avatarUrl} name={organizer.name} size={42} />
          <div className="organizer-info">
            <span className="organizer-name">{organizer.name}</span>
            {organizer.organizationTitle && (
              <span className="text-muted">{organizer.organizationTitle}</span>
            )}
          </div>
        </div>

        {/* Photo carousel centrado */}
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

        {/* Logistics panel */}
        <div className="logistics">
          <div>
            <strong>Location:</strong> {locationName}
          </div>
          <div>
            <strong>Date:</strong> {formattedDate}
          </div>
          <div>
            <strong>Participants:</strong> {currentParticipants} / {maxParticipants} (min {minParticipants})
          </div>
        </div>

        {/* Description */}
        <div className="description">
          <p>{description}</p>
        </div>

        {/* Participation block */}
        <div className="participation">
          <div>
            <strong>Available spots:</strong> {availableSpots}
          </div>
          <Button disabled={!canJoin}>Join</Button>
        </div>
      </div>
    </div>
  );
};