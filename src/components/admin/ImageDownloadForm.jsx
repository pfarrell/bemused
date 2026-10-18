import { useState } from 'react';
import { apiService } from '../../services/api';

const inputStyle = {
  width: '100%', padding: '0.5rem', fontSize: '1rem',
  border: '1px solid var(--color-border-strong)', borderRadius: '4px',
};
const labelStyle = { display: 'block', marginBottom: '0.5rem', fontWeight: '500' };

// Current cover preview plus a "download from URL" form, for entities whose
// cover is a single image_path (playlists, collections) rather than a managed
// gallery like EntityImageGallery. onDownload(url, filename) does the save and
// any reload; it should throw (an axios error is fine) on failure.
const ImageDownloadForm = ({ imagePath, alt, placeholderName, onDownload }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [imageName, setImageName] = useState('');
  const [downloading, setDownloading] = useState(false);
  const disabled = downloading || !imageUrl || !imageName;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await onDownload(imageUrl, imageName);
      setImageUrl('');
      setImageName('');
    } catch (error) {
      console.error('Error downloading image:', error);
      alert(error.response?.data?.error || 'Failed to download image');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      {imagePath && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Current Image</label>
          <img
            src={apiService.getImageUrl(imagePath, 'album_small')}
            alt={alt}
            style={{ maxWidth: '200px', borderRadius: '4px', border: '1px solid var(--color-border-strong)' }}
          />
        </div>
      )}

      <div style={{
        marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--color-bg-surface)',
        borderRadius: '4px', border: '1px solid var(--color-border)'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Download Image from URL
        </h3>
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle} htmlFor="image-download-url">Image URL</label>
          <input
            id="image-download-url"
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle} htmlFor="image-download-name">Save as Filename</label>
          <input
            id="image-download-name"
            type="text"
            value={imageName}
            onChange={(e) => setImageName(e.target.value)}
            placeholder={placeholderName}
            style={inputStyle}
          />
        </div>
        {/* type="button": this sits inside the page's edit <form>, and must not submit it */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={disabled}
          style={{
            padding: '0.5rem 1rem', backgroundColor: '#10b981', color: 'white',
            border: 'none', borderRadius: '4px', fontSize: '0.875rem',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          {downloading ? 'Downloading...' : 'Download & Save Image'}
        </button>
      </div>
    </>
  );
};

export default ImageDownloadForm;
