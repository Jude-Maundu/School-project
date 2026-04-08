/**
 * Masonry Grid Component
 * Perfect for displaying photos with varying heights on mobile and desktop
 * Uses CSS columns for optimal performance and responsive behavior
 */

import React from 'react';
import './MasonryGrid.css';

const MasonryGrid = ({
  items,
  renderItem,
  gap = 12,
  mobileColumns = 2,
  tabletColumns = 3,
  desktopColumns = 4,
  className = '',
  loading = false,
  skeletonCount = 8
}) => {
  // Show skeleton loaders while loading
  if (loading) {
    return (
      <div className={`masonry-grid ${className}`} style={{ '--gap': `${gap}px` }}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={`skeleton-${i}`} className="masonry-item masonry-skeleton">
            <div className="skeleton-loader" />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!items || items.length === 0) {
    return (
      <div className="masonry-empty">
        <div className="empty-icon">📷</div>
        <p className="empty-text">No media found</p>
      </div>
    );
  }

  return (
    <div
      className={`masonry-grid ${className}`}
      style={{
        '--gap': `${gap}px`,
        '--mobile-cols': mobileColumns,
        '--tablet-cols': tabletColumns,
        '--desktop-cols': desktopColumns
      }}
    >
      {items.map((item, index) => (
        <div key={item._id || index} className="masonry-item">
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
};

export default MasonryGrid;
