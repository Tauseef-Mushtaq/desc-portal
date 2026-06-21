import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import StarRating from './StarRating';

export default function FeedbackForm({ requestId, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      toast.error('Please select a star rating');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await axios.post(`/api/requests/${requestId}/feedback`, { rating, comment });
      toast.success('Thanks for your feedback!');
      onSubmitted?.(data.request);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-on-surface-variant">How was your experience with this request?</p>
      <StarRating value={rating} onChange={setRating} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Tell us more (optional)"
        rows={3}
        className="w-full px-3 py-2 text-sm border border-outline-variant rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 bg-surface-container-lowest"
      />
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-container transition-all active:scale-95 disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </div>
  );
}
