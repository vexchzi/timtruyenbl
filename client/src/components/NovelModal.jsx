import { useEffect, useState } from 'react';
import { getBestAuthorName } from '../utils/authorUtils';
import ReviewSection from './ReviewSection';
import VoteButton from './VoteButton';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * NovelModal - Soft Theme (Read-only) with Report Feature
 */
export default function NovelModal({ novel, isOpen, onClose, onTagClick }) {
  const [showReportForm, setShowReportForm] = useState(false);
  const [selectedWrongTags, setSelectedWrongTags] = useState([]);
  const [reportReason, setReportReason] = useState('');
  const [reportStatus, setReportStatus] = useState(null); // null, 'loading', 'success', 'error'
  const [reportMessage, setReportMessage] = useState('');

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowReportForm(false);
      setSelectedWrongTags([]);
      setReportReason('');
      setReportStatus(null);
      setReportMessage('');
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Early return after all hooks
  if (!isOpen || !novel) return null;

  const { title, description, coverImage, originalLink, standardTags = [], rawTags = [], source, readCount, chapterCount, ratingAverage, reviewCount } = novel;
  const displayAuthor = getBestAuthorName(novel);

  const getProxiedImage = (url) => url ? `${API_BASE}/image-proxy?url=${encodeURIComponent(url)}` : null;

  const handleTagClick = (tag) => {
    if (onTagClick) { onTagClick(tag); onClose(); }
  };

  const toggleWrongTag = (tag) => {
    setSelectedWrongTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmitReport = async () => {
    if (selectedWrongTags.length === 0 && !reportReason.trim()) {
      setReportStatus('error');
      setReportMessage('Vui lòng chọn tag sai hoặc nhập lý do.');
      return;
    }

    setReportStatus('loading');

    try {
      const response = await fetch(`${API_BASE}/novels/${novel._id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: 'wrong_tag',
          wrongTags: selectedWrongTags,
          reason: reportReason.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        setReportStatus('success');
        setReportMessage('Cảm ơn bạn! Báo cáo đã được gửi thành công.');
        setTimeout(() => {
          setShowReportForm(false);
          setReportStatus(null);
        }, 2000);
      } else {
        setReportStatus('error');
        setReportMessage(data.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } catch (error) {
      setReportStatus('error');
      setReportMessage('Có lỗi xảy ra. Vui lòng thử lại.');
    }
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
              {(ratingAverage > 0) && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-900/20 text-yellow-500 rounded border border-yellow-900/30">
                  <span className="font-bold">{ratingAverage}</span>
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                  <span className="text-[10px] text-yellow-600/80">({reviewCount})</span>
                </div>
              )}
            </div>
            {/* Vote Button */}
            <div className="mt-2 text-stone-300">
              <VoteButton novelId={novel._id} voteCount={novel.voteCount || 0} />
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
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-stone-500">Tags</h3>
                {!showReportForm && (
                  <button
                    onClick={() => setShowReportForm(true)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-amber-400 hover:text-amber-300 hover:bg-stone-800 rounded transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Báo lỗi tag
                  </button>
                )}
              </div>

              {!showReportForm ? (
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
              ) : (
                /* Report Form */
                <div className="bg-stone-800/50 rounded-lg p-4 border border-stone-700">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm font-medium text-amber-400">Báo cáo tag sai</span>
                  </div>

                  <p className="text-xs text-stone-400 mb-3">
                    Chọn các tag bạn cho là sai (bấm vào tag để chọn/bỏ chọn):
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {standardTags.map((tag, idx) => (
                      <button
                        key={idx}
                        onClick={() => toggleWrongTag(tag)}
                        className={`px-2.5 py-1 text-xs rounded-md transition-all border ${selectedWrongTags.includes(tag)
                          ? 'bg-red-500/20 text-red-400 border-red-500/50 ring-1 ring-red-500/30'
                          : 'bg-stone-800 text-stone-400 border-stone-700 hover:border-stone-600'
                          }`}
                      >
                        {selectedWrongTags.includes(tag) && (
                          <span className="mr-1">✕</span>
                        )}
                        {tag}
                      </button>
                    ))}
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs text-stone-400 mb-1">Lý do / Ghi chú (tuỳ chọn):</label>
                    <textarea
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="VD: Truyện này không phải ngược, chỉ có chút drama..."
                      className="w-full px-3 py-2 text-sm bg-stone-900 border border-stone-700 rounded-lg text-stone-300 placeholder-stone-600 focus:outline-none focus:border-stone-600 resize-none"
                      rows={2}
                      maxLength={500}
                    />
                  </div>

                  {/* Report Status Message */}
                  {reportStatus && (
                    <div className={`mb-3 px-3 py-2 rounded-lg text-sm ${reportStatus === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                      reportStatus === 'error' ? 'bg-red-500/20 text-red-400' :
                        'bg-stone-700 text-stone-300'
                      }`}>
                      {reportStatus === 'loading' ? 'Đang gửi...' : reportMessage}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowReportForm(false);
                        setSelectedWrongTags([]);
                        setReportReason('');
                        setReportStatus(null);
                      }}
                      className="flex-1 px-3 py-2 text-sm bg-stone-700 hover:bg-stone-600 text-stone-300 rounded-lg transition-colors"
                    >
                      Huỷ
                    </button>
                    <button
                      onClick={handleSubmitReport}
                      disabled={reportStatus === 'loading' || reportStatus === 'success'}
                      className="flex-1 px-3 py-2 text-sm bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {reportStatus === 'loading' ? 'Đang gửi...' : 'Gửi báo cáo'}
                    </button>
                  </div>
                </div>
              )}
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

          <ReviewSection novelId={novel._id} />
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

