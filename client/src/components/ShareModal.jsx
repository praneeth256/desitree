import { useState } from 'react';
import '../styles/ShareModal.css';

export default function ShareModal({ url, title, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title || 'Check out this video');

  const socials = [
    {
      name: 'WhatsApp',
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: '#25D366',
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: '#1877F2',
    },
    {
      name: 'Twitter',
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: '#0f1419',
    },
  ];

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal-header">
          <h3>Share Video</h3>
          <button className="share-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="share-modal-link">
          <input
            type="text"
            className="share-modal-input"
            value={url}
            readOnly
            onFocus={(e) => e.target.select()}
          />
          <button className="share-modal-copy" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className="share-modal-socials">
          {socials.map((s) => (
            <a
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="share-modal-social"
              style={{ background: s.color }}
            >
              {s.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

