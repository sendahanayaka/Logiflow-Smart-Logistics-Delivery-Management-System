// [S4]  proof-of-delivery capture for the active stop.
import React, { useState } from 'react';
import { useRecordPodMutation } from '../deliveryApi';

interface Props {
  shipmentId: string;
  stopKey: string;
}

export const PodForm: React.FC<Props> = ({ shipmentId, stopKey }) => {
  const [recordPod, { isLoading }] = useRecordPodMutation();
  const [receivedByName, setReceivedByName] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [signatureImageUrl, setSignatureImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canSubmit = receivedByName.trim().length > 0 && !isLoading;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setError(null);
    try {
      // On success the run refetches (tag invalidation) and this stop
      // advances to Delivered, so the form is replaced automatically.
      await recordPod({
        id: shipmentId,
        body: {
          stopKey,
          receivedByName: receivedByName.trim(),
          notes: notes.trim() || null,
          photoUrl: photoUrl.trim() || null,
          signatureImageUrl: signatureImageUrl.trim() || null,
        },
      }).unwrap();
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Could not save the proof of delivery. Please try again.';
      setError(message);
    }
  };

  return (
    <form className="pod-form" onSubmit={submit}>
      <div className="pod-form__title">Proof of delivery</div>

      {error && <div className="run-detail__error">{error}</div>}

      <label className="pod-field">
        <span>Received by <em>*</em></span>
        <input
          type="text"
          value={receivedByName}
          onChange={(e) => setReceivedByName(e.target.value)}
          placeholder="Recipient name"
          maxLength={120}
        />
      </label>

      <label className="pod-field">
        <span>Notes</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything worth recording (optional)"
          rows={2}
        />
      </label>

      <div className="pod-form__row">
        <label className="pod-field">
          <span>Photo URL</span>
          <input
            type="url"
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            placeholder="https://… (optional)"
          />
        </label>
        <label className="pod-field">
          <span>Signature URL</span>
          <input
            type="url"
            value={signatureImageUrl}
            onChange={(e) => setSignatureImageUrl(e.target.value)}
            placeholder="https://… (optional)"
          />
        </label>
      </div>

      <p className="pod-form__hint">
        Photo &amp; signature capture happens in the driver mobile app; on web, paste a URL.
      </p>

      <button type="submit" className="stop__btn stop__btn--primary" disabled={!canSubmit}>
        {isLoading ? 'Saving…' : 'Complete delivery'}
      </button>
    </form>
  );
};

export default PodForm;
