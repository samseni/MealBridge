import { useState, useRef } from 'react';
import PropTypes from 'prop-types';

export default function ImageUpload({ images = [], onChange, maxImages = 5 }) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    setError('');

    // Filter only image files
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length !== files.length) {
      setError('Some files were skipped (only images are allowed)');
    }

    // Check max images limit
    if (images.length + imageFiles.length > maxImages) {
      setError(`You can only upload up to ${maxImages} images`);
      return;
    }

    // Check file sizes
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = imageFiles.filter(file => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      setError('Some files are too large (max 5MB per image)');
      return;
    }

    // Create preview URLs for new images
    const newPreviews = imageFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      isNew: true
    }));

    onChange([...images, ...newPreviews]);
  };

  const handleRemove = (index) => {
    const newImages = images.filter((_, i) => i !== index);

    // Revoke object URL to prevent memory leaks
    if (images[index].isNew) {
      URL.revokeObjectURL(images[index].preview);
    }

    onChange(newImages);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">📷</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isDragging ? 'Drop images here' : 'Upload Food Images'}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Drag & drop images here, or click to browse
          </p>
          <p className="text-xs text-gray-500">
            Max {maxImages} images, up to 5MB each (JPG, PNG, WebP, GIF)
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={image.preview || image.url || `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${image}`}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(index);
                }}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
              >
                ×
              </button>

              {/* Image Counter */}
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-60 text-white text-xs rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Counter */}
      {images.length > 0 && (
        <p className="text-sm text-gray-600 text-center">
          {images.length} / {maxImages} images uploaded
        </p>
      )}
    </div>
  );
}

ImageUpload.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        file: PropTypes.object,
        preview: PropTypes.string,
        url: PropTypes.string,
        isNew: PropTypes.bool,
      }),
    ])
  ),
  onChange: PropTypes.func.isRequired,
  maxImages: PropTypes.number,
};