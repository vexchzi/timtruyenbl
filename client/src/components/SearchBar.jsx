import { useState } from 'react';

/**
 * SearchBar - Hỗ trợ Wattpad & WordPress
 */
export default function SearchBar({ onSearch, isLoading }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const validateUrl = (value) => {
    if (!value.trim()) return 'Vui lòng nhập link truyện';
    
    const isWattpad = value.includes('wattpad.com');
    const isWordpress = value.includes('wordpress.com') || value.includes('.wordpress.');
    
    if (!isWattpad && !isWordpress) {
      return 'Chỉ hỗ trợ link từ Wattpad hoặc WordPress';
    }
    
    if (isWattpad && !value.includes('/story/')) {
      return 'Link Wattpad không hợp lệ. Cần có /story/ trong link';
    }
    
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationError = validateUrl(url);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    onSearch(url.trim());
  };

  const handleChange = (e) => {
    setUrl(e.target.value);
    if (error) setError('');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      setError('');
    } catch (err) {
      console.log('Could not access clipboard');
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center bg-stone-800 rounded-xl border border-stone-700 overflow-hidden focus-within:border-stone-600 transition-colors">
          {/* Icon */}
          <div className="pl-4 pr-3">
            <svg className="w-5 h-5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>

          {/* Input */}
          <input
            type="text"
            value={url}
            onChange={handleChange}
            placeholder="Paste link truyện Wattpad hoặc WordPress..."
            disabled={isLoading}
            className="flex-1 py-3.5 bg-transparent text-stone-200 placeholder-stone-500 focus:outline-none text-sm disabled:opacity-50"
          />

          {/* Paste */}
          <button
            type="button"
            onClick={handlePaste}
            disabled={isLoading}
            className="px-3 py-2 mr-1 text-stone-500 hover:text-stone-300 transition-colors disabled:opacity-50"
            title="Dán từ clipboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </button>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="flex items-center gap-2 px-5 py-3.5 bg-stone-700 hover:bg-stone-600 text-stone-200 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="hidden sm:inline">Đang tìm...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="hidden sm:inline">Tìm kiếm</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-400/80 text-sm">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </form>

      {isLoading && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-stone-800/60 rounded-full border border-stone-700/50">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-stone-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            <span className="text-stone-400 text-sm">Đang phân tích truyện...</span>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div className="mt-4 text-center space-y-1">
          <p className="text-stone-500 text-sm">Hỗ trợ link từ:</p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-stone-400">
              <span className="w-2 h-2 rounded-full bg-orange-500/60"></span>
              Wattpad
            </span>
            <span className="flex items-center gap-1.5 text-stone-400">
              <span className="w-2 h-2 rounded-full bg-blue-500/60"></span>
              WordPress
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingSpinner({ size = 'md' }) {
  const sizeClasses = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <svg className={`animate-spin ${sizeClasses[size]}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
