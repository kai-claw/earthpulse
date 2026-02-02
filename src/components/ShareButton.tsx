import { Share2, Check, Link } from 'lucide-react';
import { useState, useCallback } from 'react';
import type { GlobePoint } from '../types';

interface ShareButtonProps {
  earthquake: GlobePoint;
  getShareUrl: (eq: GlobePoint) => string;
}

export default function ShareButton({ earthquake, getShareUrl }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const url = getShareUrl(earthquake);
    const shareText = `M${earthquake.magnitude.toFixed(1)} earthquake — ${earthquake.place}`;

    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'EarthPulse — Earthquake',
          text: shareText,
          url,
        });
        return;
      } catch {
        // User cancelled or not supported — fall through to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [earthquake, getShareUrl]);

  return (
    <button
      className={`share-btn ${copied ? 'share-copied' : ''}`}
      onClick={handleShare}
      aria-label={copied ? 'Link copied!' : 'Share earthquake'}
      title={copied ? 'Link copied!' : 'Share earthquake link'}
    >
      {copied ? (
        <>
          <Check size={14} />
          <span>Copied!</span>
        </>
      ) : (
        <>
          {'share' in navigator ? <Share2 size={14} /> : <Link size={14} />}
          <span>Share</span>
        </>
      )}
    </button>
  );
}
