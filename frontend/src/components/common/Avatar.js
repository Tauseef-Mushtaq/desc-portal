import React, { useState, useEffect } from 'react';

// One place that decides "show the photo, or show the default" — used
// anywhere a user's avatar appears. Falls back to a generic icon both when
// no avatar is set AND when the image fails to actually load (a broken or
// expired signed URL shouldn't show a broken-image icon to a citizen).
export default function Avatar({ user, size = 40, className = '' }) {
  const [imgFailed, setImgFailed] = useState(false);

  // Reset the failure flag when the avatar URL itself changes (e.g. after
  // a fresh upload, or a newly-signed URL on next page load).
  useEffect(() => {
    setImgFailed(false);
  }, [user?.avatar]);

  const showImage = Boolean(user?.avatar) && !imgFailed;

  if (showImage) {
    return (
      <img
        src={user.avatar}
        alt={user?.fullName || 'Profile picture'}
        onError={() => setImgFailed(true)}
        className={`rounded-full object-cover flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-primary flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="material-symbols-outlined text-white" style={{ fontSize: Math.round(size * 0.55) }}>
        person
      </span>
    </div>
  );
}
