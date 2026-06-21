import React, { useState } from 'react';

export default function StarRating({ value = 0, onChange, readOnly = false, size = 24 }) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className={readOnly ? 'cursor-default' : 'cursor-pointer'}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: size,
              fontVariationSettings: star <= display ? "'FILL' 1" : "'FILL' 0",
              color: star <= display ? '#f5b301' : '#c4c6cf',
            }}
          >
            star
          </span>
        </button>
      ))}
    </div>
  );
}
