import { useState, useEffect, useMemo } from 'react';
import NovelCard, { NovelCardGrid, NovelCardSkeleton, NovelCardGridSkeleton } from './NovelCard';
import TagFilter from './TagFilter';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function BrowsePage({ onNovelClick }) {
  const [novels, setNovels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [excludedTags, setExcludedTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState('list');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [tagDescriptions, setTagDescriptions] = useState({});
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      if (searchQuery !== debouncedSearch) setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => { loadNovels(); }, [selectedTags, sortBy, page, debouncedSearch]);

  const loadNovels = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '30', sort: sortBy });
      if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());

      const res = await fetch(`${API_BASE}/novels?${params}`);
      const data = await res.json();
      if (data.success) {
        if (page === 1) setNovels(data.data.novels);
        else setNovels(prev => [...prev, ...data.data.novels]);
        setHasMore(data.data.pagination.hasMore);
        setTotalCount(data.data.pagination.total);
      }
    } catch (err) {
      setError('Không thể tải danh sách truyện');
    } finally {
      setIsLoading(false);
    }
  };

  const isVietnamese = (text) => text && /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);

  const filteredNovels = useMemo(() => {
    return novels.filter(novel => {
      // Chỉ lọc nội dung không phải tiếng Việt
      if (!isVietnamese(novel.title) && !isVietnamese(novel.description) && !novel.rawTags?.some(t => isVietnamese(t))) return false;
      // Lọc theo tags bị loại trừ
      if (excludedTags.length > 0 && novel.standardTags?.some(t => excludedTags.includes(t))) return false;
      return true;
    });
  }, [novels, excludedTags]);

  useEffect(() => {
    const saved = localStorage.getItem('excludedTags');
    if (saved) try { setExcludedTags(JSON.parse(saved)); } catch (e) { }
    const savedView = localStorage.getItem('viewMode');
    if (savedView) setViewMode(savedView);
  }, []);

  const CardComponent = viewMode === 'grid' ? NovelCardGrid : NovelCard;
  const SkeletonComponent = viewMode === 'grid' ? NovelCardGridSkeleton : NovelCardSkeleton;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-14 z-20 bg-stone-900/90 backdrop-blur-lg border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-stone-100">Thư viện</h1>
              <span className="px-2 py-0.5 bg-stone-700 text-stone-300 text-xs rounded">{totalCount.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative hidden md:block">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm tên/tác giả..."
                  className="w-44 px-3 py-1.5 pl-8 bg-stone-800 border border-stone-700 rounded-lg text-stone-200 text-sm placeholder-stone-500 focus:outline-none focus:border-stone-600"
                />
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="px-2 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-stone-200 text-sm focus:outline-none"
              >
                <option value="popular">Hot nhất</option>
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="title">Tên A-Z</option>
              </select>

              <div className="flex bg-stone-800 border border-stone-700 rounded-lg p-0.5">
                <button
                  onClick={() => { setViewMode('list'); localStorage.setItem('viewMode', 'list'); }}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-stone-700 text-stone-200' : 'text-stone-500 hover:text-stone-300'}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => { setViewMode('grid'); localStorage.setItem('viewMode', 'grid'); }}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-stone-700 text-stone-200' : 'text-stone-500 hover:text-stone-300'}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`lg:hidden p-1.5 border rounded-lg transition-colors ${selectedTags.length > 0 || excludedTags.length > 0
                    ? 'bg-stone-700 border-stone-600 text-stone-200'
                    : 'bg-stone-800 border-stone-700 text-stone-400'
                  }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-4">
          <aside className={`${showFilters ? 'fixed inset-0 z-30 bg-stone-900/98 p-4 pt-20 overflow-auto' : 'hidden'} lg:block lg:static lg:bg-transparent lg:w-72 lg:flex-shrink-0`}>
            {showFilters && (
              <div className="lg:hidden flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-stone-100">Bộ lọc</h2>
                <button onClick={() => setShowFilters(false)} className="p-2 text-stone-300 hover:bg-stone-800 rounded-lg">✕</button>
              </div>
            )}

            <div className="lg:sticky lg:top-32 space-y-4">
              <TagFilter
                selectedTags={selectedTags}
                excludedTags={excludedTags}
                onTagsChange={(tags) => { setSelectedTags(tags); setPage(1); }}
                onExcludedTagsChange={(tags) => { setExcludedTags(tags); localStorage.setItem('excludedTags', JSON.stringify(tags)); }}
                onTagDescriptionsLoaded={setTagDescriptions}
              />

              {showFilters && (
                <button
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden w-full py-3 bg-stone-700 hover:bg-stone-600 text-stone-100 font-medium rounded-xl transition-colors"
                >
                  Áp dụng ({selectedTags.length + excludedTags.length})
                </button>
              )}
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="md:hidden mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên/tác giả..."
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-stone-200 text-sm placeholder-stone-500 focus:outline-none focus:border-stone-600"
              />
            </div>

            {selectedTags.length > 0 && selectedTags.some(tag => tagDescriptions[tag]) && (
              <div className="mb-4 p-3 soft-card">
                <div className="text-xs text-stone-500 mb-2">Mô tả tag đã chọn:</div>
                <div className="space-y-1.5">
                  {selectedTags.filter(tag => tagDescriptions[tag]).map(tag => (
                    <div key={tag} className="flex items-start gap-2">
                      <span className="px-2 py-0.5 bg-stone-700 text-stone-300 rounded text-xs shrink-0">{tag}</span>
                      <span className="text-stone-400 text-xs leading-relaxed">{tagDescriptions[tag]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && <div className="p-4 soft-card mb-4 text-red-400/80">{error}</div>}

            {!isLoading && filteredNovels.length > 0 && (
              <div className="mb-3 text-xs text-stone-500">
                Hiển thị {filteredNovels.length} / {novels.length} truyện
                {excludedTags.length > 0 && ` (ẩn ${novels.length - filteredNovels.length})`}
              </div>
            )}

            <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3'}>
              {isLoading && page === 1 ? (
                Array.from({ length: 18 }).map((_, i) => <SkeletonComponent key={i} />)
              ) : filteredNovels.length > 0 ? (
                filteredNovels.map((novel, idx) => (
                  <CardComponent
                    key={novel._id || idx}
                    novel={novel}
                    onTagClick={(tag) => { if (!selectedTags.includes(tag)) { setSelectedTags([...selectedTags, tag]); setPage(1); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}
                    onCardClick={onNovelClick}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-stone-500 mb-4">Không tìm thấy truyện phù hợp</p>
                  <button onClick={() => { setSelectedTags([]); setExcludedTags([]); setSearchQuery(''); setPage(1); }} className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded-lg">
                    Xóa bộ lọc
                  </button>
                </div>
              )}
            </div>

            {hasMore && !isLoading && filteredNovels.length > 0 && (
              <div className="mt-6 text-center">
                <button onClick={() => setPage(p => p + 1)} className="px-6 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors text-sm">
                  Xem thêm
                </button>
              </div>
            )}

            {isLoading && page > 1 && <div className="mt-6 text-center text-stone-500 text-sm">Đang tải...</div>}
          </main>
        </div>
      </div>
    </div>
  );
}
