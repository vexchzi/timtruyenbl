import { useState, useEffect, useMemo } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const CATEGORY_ORDER = ['genre', 'ending', 'setting', 'content', 'relationship', 'character', 'other'];
const CATEGORY_NAMES = {
  genre: 'Thể loại', ending: 'Kết thúc', relationship: 'Quan hệ',
  character: 'Nhân vật', content: 'Nội dung', setting: 'Bối cảnh', other: 'Khác'
};

/**
 * TagFilter - Soft Theme
 */
export default function TagFilter({ selectedTags = [], excludedTags = [], onTagsChange, onExcludedTagsChange, onTagDescriptionsLoaded }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('include');
  const [expandedCategories, setExpandedCategories] = useState(['genre', 'ending', 'content']);
  const [tagCategories, setTagCategories] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTags = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE}/tags?minCount=3`);
        const data = await response.json();
        if (data.success && data.data.categories) {
          setTagCategories(data.data.categories);
          if (onTagDescriptionsLoaded) {
            const descMap = {};
            Object.values(data.data.categories).forEach(cat => {
              cat.tags?.forEach(tag => { if (tag.description) descMap[tag.name] = tag.description; });
            });
            onTagDescriptionsLoaded(descMap);
          }
        }
      } catch (err) {
        setError('Không thể tải tags');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTags();
  }, []);

  const toggleCategory = (key) => {
    setExpandedCategories(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const toggleTag = (tagName) => {
    if (activeTab === 'include') {
      const newTags = selectedTags.includes(tagName) ? selectedTags.filter(t => t !== tagName) : [...selectedTags, tagName];
      onTagsChange(newTags);
    } else {
      const newExcluded = excludedTags.includes(tagName) ? excludedTags.filter(t => t !== tagName) : [...excludedTags, tagName];
      onExcludedTagsChange(newExcluded);
    }
  };

  const filteredCategories = useMemo(() => {
    if (!searchTerm) return tagCategories;
    const filtered = {};
    Object.entries(tagCategories).forEach(([key, category]) => {
      const matchingTags = category.tags.filter(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase()));
      if (matchingTags.length > 0) filtered[key] = { ...category, tags: matchingTags };
    });
    return filtered;
  }, [tagCategories, searchTerm]);

  const clearAll = () => {
    if (activeTab === 'include') onTagsChange([]);
    else onExcludedTagsChange([]);
  };

  if (isLoading) {
    return (
      <div className="soft-card p-5">
        <div className="space-y-3">
          <div className="h-6 bg-stone-700/40 rounded w-1/3 animate-pulse"></div>
          <div className="h-10 bg-stone-700/40 rounded animate-pulse"></div>
          {[1,2,3].map(i => <div key={i} className="h-8 bg-stone-700/40 rounded animate-pulse"></div>)}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="soft-card p-5"><p className="text-red-400/80 text-sm">{error}</p></div>;
  }

  return (
    <div className="soft-card overflow-hidden">
      <div className="p-4 border-b border-stone-700/50">
        <h3 className="font-semibold text-stone-200 mb-3">Bộ lọc Tag</h3>
        <div className="flex bg-stone-900/50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('include')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'include' ? 'bg-stone-700 text-stone-100' : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            Muốn xem
            {selectedTags.length > 0 && <span className="px-1.5 py-0.5 bg-stone-600 rounded text-xs">{selectedTags.length}</span>}
          </button>
          <button
            onClick={() => setActiveTab('exclude')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'exclude' ? 'bg-stone-700 text-stone-100' : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            Không muốn
            {excludedTags.length > 0 && <span className="px-1.5 py-0.5 bg-stone-600 rounded text-xs">{excludedTags.length}</span>}
          </button>
        </div>
      </div>

      <div className="p-3 border-b border-stone-700/30">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm tag..."
          className="w-full px-3 py-2 bg-stone-900/50 border border-stone-700/50 rounded-lg text-stone-200 text-sm placeholder-stone-500 focus:outline-none focus:border-stone-600"
        />
      </div>

      {((activeTab === 'include' && selectedTags.length > 0) || (activeTab === 'exclude' && excludedTags.length > 0)) && (
        <div className="p-3 border-b border-stone-700/30 bg-stone-900/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-stone-500">{activeTab === 'include' ? 'Đã chọn:' : 'Đã ẩn:'}</span>
            <button onClick={clearAll} className="text-xs text-stone-400 hover:text-stone-300">Xóa tất cả</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(activeTab === 'include' ? selectedTags : excludedTags).map(tag => (
              <span
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md cursor-pointer transition-colors ${
                  activeTab === 'include' ? 'bg-stone-600 text-stone-200' : 'bg-stone-700 text-stone-400 line-through'
                }`}
              >
                {tag} ×
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="max-h-[50vh] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#44403c transparent' }}>
        {CATEGORY_ORDER.filter(key => filteredCategories[key]).map(key => {
          const category = filteredCategories[key];
          if (!category.tags?.length) return null;
          
          const isExpanded = expandedCategories.includes(key);
          const selectedInCategory = category.tags.filter(t => selectedTags.includes(t.name)).length;
          const excludedInCategory = category.tags.filter(t => excludedTags.includes(t.name)).length;

          return (
            <div key={key} className="border-b border-stone-700/30 last:border-b-0">
              <button
                onClick={() => toggleCategory(key)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-stone-800/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-stone-200 text-sm">{category.name || CATEGORY_NAMES[key]}</span>
                  <span className="text-xs text-stone-500">({category.tags.length})</span>
                  {selectedInCategory > 0 && <span className="px-1.5 py-0.5 bg-stone-600 text-stone-200 text-xs rounded">{selectedInCategory}</span>}
                  {excludedInCategory > 0 && <span className="px-1.5 py-0.5 bg-stone-700 text-stone-400 text-xs rounded line-through">{excludedInCategory}</span>}
                </div>
                <span className="text-stone-500 text-xs">{isExpanded ? '▲' : '▼'}</span>
              </button>

              {isExpanded && (
                <div className="px-4 pb-3">
                  <div className="flex flex-wrap gap-1.5">
                    {category.tags.map(tag => {
                      const isSelected = selectedTags.includes(tag.name);
                      const isExcluded = excludedTags.includes(tag.name);
                      const isActive = activeTab === 'include' ? isSelected : isExcluded;
                      const isDisabled = (isExcluded && activeTab === 'include') || (isSelected && activeTab === 'exclude');

                      return (
                        <button
                          key={tag.name}
                          onClick={() => !isDisabled && toggleTag(tag.name)}
                          disabled={isDisabled}
                          title={`${tag.count} truyện`}
                          className={`px-2.5 py-1.5 text-xs rounded-md transition-colors border ${
                            isActive
                              ? activeTab === 'include'
                                ? 'bg-stone-600 text-stone-100 border-stone-500'
                                : 'bg-stone-700 text-stone-400 border-stone-600 line-through'
                              : isDisabled
                                ? 'bg-stone-800/50 text-stone-600 border-stone-700/30 cursor-not-allowed'
                                : 'bg-stone-800 text-stone-400 border-stone-700 hover:border-stone-600 hover:bg-stone-700'
                          }`}
                        >
                          {tag.name}
                          {tag.count && <span className="ml-1 text-[10px] opacity-60">({tag.count})</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {Object.keys(filteredCategories).length === 0 && (
          <div className="p-6 text-center text-stone-500 text-sm">Không tìm thấy tag nào</div>
        )}
      </div>
    </div>
  );
}

export function CompactTagFilter({ selectedTags = [], excludedTags = [], onClear }) {
  if (selectedTags.length === 0 && excludedTags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-stone-800 text-sm">
      {selectedTags.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-stone-500 text-xs">Lọc:</span>
          {selectedTags.slice(0, 5).map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-stone-700 text-stone-300 rounded text-xs">{tag}</span>
          ))}
          {selectedTags.length > 5 && <span className="text-stone-500 text-xs">+{selectedTags.length - 5}</span>}
        </div>
      )}
      {excludedTags.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-stone-500 text-xs">Ẩn:</span>
          {excludedTags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-stone-800 text-stone-500 rounded text-xs line-through">{tag}</span>
          ))}
          {excludedTags.length > 3 && <span className="text-stone-500 text-xs">+{excludedTags.length - 3}</span>}
        </div>
      )}
      <button onClick={onClear} className="text-xs text-stone-400 hover:text-stone-300 ml-2">Xóa bộ lọc</button>
    </div>
  );
}
