import React, { useState } from 'react';
import { Star } from 'lucide-react';

const RATING_LABELS = {
  1: 'Very Poor',
  2: 'Poor',
  3: 'Average',
  4: 'Good',
  5: 'Excellent'
};

export const RatingInput = ({
  value = 0,
  onChange = () => {},
  readOnly = false,
  size = 22,
  showLabel = true
}) => {
  const [hoverValue, setHoverValue] = useState(0);

  const displayValue = hoverValue || value || 0;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayValue;
          return (
            <button
              key={star}
              type="button"
              disabled={readOnly}
              onClick={() => !readOnly && onChange(star)}
              onMouseEnter={() => !readOnly && setHoverValue(star)}
              onMouseLeave={() => !readOnly && setHoverValue(0)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '2px',
                cursor: readOnly ? 'default' : 'pointer',
                color: isFilled ? '#fbbf24' : 'var(--text-muted, #475569)',
                transition: 'transform 0.15s ease, color 0.15s ease',
                transform: !readOnly && star === hoverValue ? 'scale(1.2)' : 'scale(1)'
              }}
              title={RATING_LABELS[star]}
              aria-label={`${star} Stars - ${RATING_LABELS[star]}`}
            >
              <Star
                size={size}
                fill={isFilled ? '#fbbf24' : 'transparent'}
                strokeWidth={1.75}
              />
            </button>
          );
        })}
      </div>

      {showLabel && displayValue > 0 && (
        <span
          style={{
            fontSize: '0.82rem',
            fontWeight: '600',
            color: '#fbbf24',
            minWidth: '70px'
          }}
        >
          {RATING_LABELS[displayValue]} ({displayValue}/5)
        </span>
      )}
    </div>
  );
};
