import { useEffect } from 'react';
import { getBestAuthorName } from '../utils/authorUtils';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * NovelModal - Soft Theme (Read-only)
 */
export default function NovelModal({ novel, isOpen, onClose, onTagClick }) {
  if (!isOpen || !novel) return null;

  const { title, description, coverImage, originalLink, standardTags = [], rawTags = [], source, readCount, chapterCount } = novel;
  const displayAuthor = getBestAuthorName(novel);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const getProxiedImage = (url) => url ? `${API_BASE}/image-proxy?url=${encodeURIComponent(url)}` : null;

  const handleTagClick = (tag) => {
    if (onTagClick) { onTagClick(tag); onClose(); }
  };

  const firstChar = title?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-stone-900 rounded-xl border border-stone-700 shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-4 p-4 border-b border-stone-800">
          <div className="w-24 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-stone-800">
            {coverImage ? (
              <img
                src={getProxiedImage(coverImage)}
                alt={title}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <div className={`w-full h-full items-center justify-center ${coverImage ? 'hidden' : 'flex'}`}>
              <span className="text-3xl font-bold text-stone-600">{firstChar}</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-stone-100 mb-1 line-clamp-2">{title}</h2>
            <p className="text-stone-400 text-sm mb-2">{displayAuthor}</p>
            
            <div className="flex flex-wrap gap-2 text-xs text-stone-500">
              {source && (
                <span className="px-2 py-0.5 bg-stone-800 rounded">
                  {source === 'wattpad' ? 'Wattpad' : source === 'wordpress' ? 'WordPress' : source === 'navyteam' ? 'NavyTeam' : source}
                </span>
              )}
              {chapterCount > 0 && <span className="px-2 py-0.5 bg-stone-800 rounded">{chapterCount} chương</span>}
              {readCount > 0 && <span className="px-2 py-0.5 bg-stone-800 rounded">{readCount.toLocaleString()} lượt đọc</span>}
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-stone-500 hover:text-stone-300 hover:bg-stone-800 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-stone-500 mb-2">Giới thiệu</h3>
            <div className="text-stone-300 text-sm leading-relaxed whitespace-pre-line">
              {description || 'Chưa có giới thiệu.'}
            </div>
          </div>

          {standardTags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-stone-500 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {standardTags.map((tag, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleTagClick(tag)}
                    className="px-2.5 py-1 text-xs bg-stone-800 text-stone-400 rounded-md hover:bg-stone-700 hover:text-stone-300 transition-colors border border-stone-700"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {rawTags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-stone-500 mb-2">Tags gốc</h3>
              <div className="flex flex-wrap gap-1.5">
                {rawTags.slice(0, 20).map((tag, idx) => (
                  <span key={idx} className="px-2 py-0.5 text-xs bg-stone-800/50 text-stone-500 rounded">#{tag}</span>
                ))}
                {rawTags.length > 20 && <span className="px-2 py-0.5 text-xs text-stone-600">+{rawTags.length - 20} more</span>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors text-sm font-medium">
            Đóng
          </button>
          <a
            href={originalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-2.5 bg-stone-700 hover:bg-stone-600 text-stone-100 rounded-lg transition-colors text-sm font-medium text-center"
          >
            Đọc truyện
          </a>
        </div>
      </div>
    </div>
  );
}
