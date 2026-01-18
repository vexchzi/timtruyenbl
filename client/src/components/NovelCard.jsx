import { useState, useEffect } from 'react';
import TagBadge from './TagBadge';
import { getBestAuthorName } from '../utils/authorUtils';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const PLACEHOLDER_COLORS = {
  'A': 'from-stone-700 to-stone-800',
  'B': 'from-stone-700 to-stone-800',
  'C': 'from-stone-700 to-stone-800',
  'D': 'from-stone-700 to-stone-800',
  'E': 'from-stone-700 to-stone-800',
  'default': 'from-stone-700 to-stone-800'
};

const getPlaceholderColor = (char) => {
  return PLACEHOLDER_COLORS[char?.toUpperCase()] || PLACEHOLDER_COLORS['default'];
};

/**
 * NovelCard - Soft Theme
 */
export default function NovelCard({ novel, matchingTags = [], showMatchScore = false, onTagClick, onCardClick }) {
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  const { title, coverImage, originalLink, standardTags = [], similarityScore } = novel;

  const isValidImageUrl = (url) => url && typeof url === 'string' && (url.startsWith('http') || url.startsWith('data:'));
  const hasValidCover = isValidImageUrl(coverImage);
  const getProxiedImage = (url) => url ? `${API_BASE}/image-proxy?url=${encodeURIComponent(url)}` : null;

  const coverSrc = hasValidCover ? getProxiedImage(coverImage) : null;
  const matchPercent = similarityScore ? `${Math.round(similarityScore * 100)}%` : null;
  const firstChar = title?.charAt(0)?.toUpperCase() || '?';
  const placeholderColor = getPlaceholderColor(firstChar);
  const displayAuthor = getBestAuthorName(novel);

  useEffect(() => {
    setShowPlaceholder(true);
    setImageLoaded(false);
  }, [novel._id, coverImage]);

  const handleTagClick = (e, tag) => {
    e.preventDefault();
    e.stopPropagation();
    if (onTagClick) onTagClick(tag);
  };

  const handleCardClick = (e) => {
    e.preventDefault();
    if (onCardClick) onCardClick(novel);
    else window.open(originalLink, '_blank');
  };

  const handleExternalLink = (e) => {
    e.stopPropagation();
    window.open(originalLink, '_blank');
  };

  return (
    <div onClick={handleCardClick} className="group block cursor-pointer">
      <div className="relative bg-stone-800/60 rounded-lg border border-stone-700/60 overflow-hidden transition-all duration-200 hover:border-stone-600 hover:bg-stone-800">
        {showMatchScore && matchPercent && (
          <div className="absolute top-2 right-2 z-10">
            <div className="px-2 py-0.5 bg-stone-700 rounded text-xs font-medium text-stone-300">
              {matchPercent}
            </div>
          </div>
        )}

        <div className="flex">
          <div className={`relative w-20 h-24 flex-shrink-0 bg-gradient-to-br ${placeholderColor}`}>
            {showPlaceholder && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-stone-500">{firstChar}</span>
              </div>
            )}
            {coverSrc && (
              <img
                src={coverSrc}
                alt=""
                loading="lazy"
                decoding="async"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => { setImageLoaded(true); setShowPlaceholder(false); }}
                onError={() => { setShowPlaceholder(true); setImageLoaded(false); }}
              />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <span className="text-white/90 opacity-0 group-hover:opacity-100 transition-opacity text-xs">Xem</span>
            </div>
          </div>

          <div className="flex-1 p-3 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-stone-200 text-sm leading-tight mb-1 line-clamp-1 group-hover:text-stone-100 transition-colors flex-1">
                {title}
              </h3>
              <button
                onClick={handleExternalLink}
                className="p-1 text-stone-600 hover:text-stone-400 rounded transition-colors flex-shrink-0"
                title="Mở link gốc"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>
            
            <p className="text-stone-500 text-xs mb-2 truncate">{displayAuthor}</p>

            <div className="flex flex-wrap gap-1">
              {standardTags.slice(0, 4).map((tag, index) => (
                <TagBadge 
                  key={index} 
                  tag={tag} 
                  isMatching={matchingTags.includes(tag)}
                  size="xs"
                  onClick={onTagClick ? (e) => handleTagClick(e, tag) : undefined}
                />
              ))}
              {standardTags.length > 4 && (
                <span className="px-1.5 py-0.5 text-xs text-stone-600">+{standardTags.length - 4}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NovelCardGrid({ novel, matchingTags = [], showMatchScore = false, onTagClick, onCardClick }) {
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  const { title, coverImage, originalLink, standardTags = [], similarityScore } = novel;
  const isValidImageUrl = (url) => url && typeof url === 'string' && (url.startsWith('http') || url.startsWith('data:'));
  const hasValidCover = isValidImageUrl(coverImage);
  const getProxiedImage = (url) => url ? `${API_BASE}/image-proxy?url=${encodeURIComponent(url)}` : null;

  const coverSrc = hasValidCover ? getProxiedImage(coverImage) : null;
  const matchPercent = similarityScore ? `${Math.round(similarityScore * 100)}%` : null;
  const firstChar = title?.charAt(0)?.toUpperCase() || '?';
  const placeholderColor = getPlaceholderColor(firstChar);
  const displayAuthor = getBestAuthorName(novel);

  useEffect(() => {
    setShowPlaceholder(true);
    setImageLoaded(false);
  }, [novel._id, coverImage]);

  const handleTagClick = (e, tag) => {
    e.preventDefault();
    e.stopPropagation();
    if (onTagClick) onTagClick(tag);
  };

  const handleCardClick = (e) => {
    e.preventDefault();
    if (onCardClick) onCardClick(novel);
    else window.open(originalLink, '_blank');
  };

  const handleExternalLink = (e) => {
    e.stopPropagation();
    window.open(originalLink, '_blank');
  };

  return (
    <div onClick={handleCardClick} className="group block cursor-pointer">
      <div className="relative bg-stone-800/60 rounded-lg border border-stone-700/60 overflow-hidden transition-all duration-200 hover:border-stone-600 hover:bg-stone-800 hover:-translate-y-0.5">
        {showMatchScore && matchPercent && (
          <div className="absolute top-2 right-2 z-10">
            <div className="px-2 py-0.5 bg-stone-700 rounded text-xs font-medium text-stone-300">
              {matchPercent}
            </div>
          </div>
        )}

        <button
          onClick={handleExternalLink}
          className="absolute top-2 left-2 z-10 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded transition-colors opacity-0 group-hover:opacity-100"
          title="Mở link gốc"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </button>

        <div className={`relative aspect-[4/3] bg-gradient-to-br ${placeholderColor}`}>
          {showPlaceholder && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-stone-500/60">{firstChar}</span>
            </div>
          )}
          {coverSrc && (
            <img
              src={coverSrc}
              alt=""
              loading="lazy"
              decoding="async"
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => { setImageLoaded(true); setShowPlaceholder(false); }}
              onError={() => { setShowPlaceholder(true); setImageLoaded(false); }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 to-transparent"></div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm">Xem chi tiết</span>
          </div>
        </div>

        <div className="p-3">
          <h3 className="font-medium text-stone-200 text-sm leading-tight mb-1 line-clamp-2 group-hover:text-stone-100 transition-colors">
            {title}
          </h3>
          <p className="text-stone-500 text-xs mb-2 truncate">{displayAuthor}</p>
          <div className="flex flex-wrap gap-1">
            {standardTags.slice(0, 3).map((tag, index) => (
              <TagBadge 
                key={index} 
                tag={tag} 
                isMatching={matchingTags.includes(tag)} 
                size="xs"
                onClick={onTagClick ? (e) => handleTagClick(e, tag) : undefined}
              />
            ))}
            {standardTags.length > 3 && (
              <span className="px-1.5 py-0.5 text-xs text-stone-600">+{standardTags.length - 3}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function NovelCardSkeleton() {
  return (
    <div className="bg-stone-800/60 rounded-lg border border-stone-700/60 overflow-hidden">
      <div className="flex">
        <div className="w-20 h-24 bg-stone-700/40 animate-pulse"></div>
        <div className="flex-1 p-3 space-y-2">
          <div className="h-4 bg-stone-700/40 rounded w-3/4 animate-pulse"></div>
          <div className="h-3 bg-stone-700/40 rounded w-1/2 animate-pulse"></div>
          <div className="flex gap-1">
            <div className="h-5 bg-stone-700/40 rounded w-12 animate-pulse"></div>
            <div className="h-5 bg-stone-700/40 rounded w-10 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NovelCardGridSkeleton() {
  return (
    <div className="bg-stone-800/60 rounded-lg border border-stone-700/60 overflow-hidden">
      <div className="aspect-[4/3] bg-stone-700/40 animate-pulse"></div>
      <div className="p-3 space-y-2">
        <div className="h-4 bg-stone-700/40 rounded w-3/4 animate-pulse"></div>
        <div className="h-3 bg-stone-700/40 rounded w-1/2 animate-pulse"></div>
        <div className="flex gap-1">
          <div className="h-5 bg-stone-700/40 rounded w-12 animate-pulse"></div>
          <div className="h-5 bg-stone-700/40 rounded w-10 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
