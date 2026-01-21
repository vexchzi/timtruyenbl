import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import HomePage from './components/HomePage';
import BrowsePage from './components/BrowsePage';
import RankingPage from './components/RankingPage';
import NovelModal from './components/NovelModal';
import ChangelogModal from './components/ChangelogModal';
import { getStats, getNovelById } from './services/api';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * App Component - With Routing & Global Modal
 */
export default function App() {
  const [stats, setStats] = useState(null);
  const [notice, setNotice] = useState(null);
  const [showNoticePopup, setShowNoticePopup] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);

  // Navigation & Modal State
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [selectedNovel, setSelectedNovel] = useState(null);
  // Modal is open if selectedNovel is set
  const isModalOpen = !!selectedNovel;

  // 1. Handle Global Modal (Novel Details) via URL
  const novelId = searchParams.get('novelId');

  useEffect(() => {
    async function fetchNovel() {
      if (!novelId) {
        setSelectedNovel(null);
        return;
      }

      // If we already have the correct novel loaded, don't re-fetch
      if (selectedNovel && selectedNovel._id === novelId) return;

      try {
        const data = await getNovelById(novelId);
        // API returns { novel: {...}, recommendations: [...] }
        if (data.novel) {
          setSelectedNovel(data.novel);
        } else {
          setSelectedNovel(data);
        }
      } catch (err) {
        console.error('Failed to load novel:', err);
        // Remove param if invalid
        setSearchParams(params => {
          params.delete('novelId');
          return params;
        });
      }
    }

    fetchNovel();
  }, [novelId]);

  // Handler for clicking a novel card -> Updates URL (pushes history)
  const handleNovelClick = (novel) => {
    // Optimistically set data to avoid flicker
    setSelectedNovel(novel);
    setSearchParams({ novelId: novel._id });
  };

  // Handler for closing modal -> Updates URL (backwards or clear)
  const handleCloseModal = () => {
    setSelectedNovel(null);

    // If we want "Back" button behavior to close modal, 
    // we should just go back if we pushed state.
    // However, explicit close usually means "Clear param".
    // Let's check history length or just clear params.
    // Clearing params is safer.
    setSearchParams(params => {
      params.delete('novelId');
      return params;
    });
  };

  // 2. Initial Data Fetch
  useEffect(() => {
    getStats().then(data => setStats(data)).catch(() => { });

    fetch(`${API_BASE}/notice`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setNotice(data.data);
        }
      })
      .catch(() => { });
  }, []);

  return (
    <div className="min-h-screen">
      <Navigation
        currentPath={location.pathname}
        stats={stats}
        notice={notice}
        onShowNotice={() => setShowNoticePopup(true)}
        onShowChangelog={() => setShowChangelog(true)}
      />

      <Routes>
        <Route
          path="/"
          element={<HomePage stats={stats} onNovelClick={handleNovelClick} />}
        />
        <Route
          path="/browse"
          element={<BrowsePage onNovelClick={handleNovelClick} />}
        />
        <Route
          path="/ranking"
          element={<RankingPage onNovelClick={handleNovelClick} />}
        />
        {/* Redirect unknown routes to home */}
        <Route path="*" element={<HomePage stats={stats} onNovelClick={handleNovelClick} />} />
      </Routes>

      <NovelModal
        novel={selectedNovel}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      <NoticePopup
        notice={notice}
        isOpen={showNoticePopup}
        onClose={() => setShowNoticePopup(false)}
      />

      <ChangelogModal
        isOpen={showChangelog}
        onClose={() => setShowChangelog(false)}
      />
    </div>
  );
}

/**
 * Navigation - Soft theme
 */
function Navigation({ currentPath, stats, notice, onShowNotice, onShowChangelog }) {
  return (
    <nav className="sticky top-0 z-50 bg-stone-900/90 backdrop-blur-lg border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-stone-100 font-medium group"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-stone-700/60 group-hover:bg-stone-700 transition-colors">
              <svg className="w-4 h-4 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="hidden sm:inline text-sm">BL Novel</span>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentPath === '/'
                ? 'bg-stone-800 text-stone-100'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                }`}
            >
              Tìm kiếm
            </Link>
            <Link
              to="/browse"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${currentPath === '/browse'
                ? 'bg-stone-800 text-stone-100'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                }`}
            >
              Thư viện
              {stats?.totalNovels && (
                <span className="px-2 py-0.5 text-xs rounded-md bg-stone-700 text-stone-300">
                  {stats.totalNovels.toLocaleString()}
                </span>
              )}
            </Link>
            <Link
              to="/ranking"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${currentPath === '/ranking'
                ? 'bg-stone-800 text-stone-100'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              BXH
            </Link>
          </div>

          {/* Info button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onShowChangelog}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-stone-400 hover:text-stone-200 hover:bg-stone-800/50 transition-colors"
              title="Nhật ký cập nhật / Tính năng"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </button>

            {notice?.isActive && (
              <button
                onClick={onShowNotice}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-amber-400 hover:text-amber-300 hover:bg-stone-800/50 transition-colors"
                title="Xem thông báo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">Thông báo</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav >
  );
}

/**
 * Notice Popup
 */
function NoticePopup({ notice, isOpen, onClose }) {
  if (!isOpen || !notice) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-stone-900 rounded-xl border border-stone-700 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-500/20">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-stone-100">{notice.title || 'Thông báo'}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-500 hover:text-stone-300 hover:bg-stone-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <div
            className="text-stone-300 text-sm leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: notice.content || '' }}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-stone-700 hover:bg-stone-600 text-stone-100 rounded-lg transition-colors text-sm font-medium"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
