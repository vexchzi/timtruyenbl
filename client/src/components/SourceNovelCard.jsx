import { TagList } from './TagBadge';

/**
 * SourceNovelCard - Soft Theme
 */
export default function SourceNovelCard({ novel }) {
  const { title, author, description, coverImage, originalLink, standardTags = [], rawTags = [], isNew } = novel;
  const firstChar = title?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="relative">
      <div className="relative bg-stone-800/80 rounded-xl border border-stone-700 overflow-hidden">
        {isNew && (
          <div className="absolute top-4 right-4 z-10">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800/80 rounded-full text-xs font-medium text-emerald-200 border border-emerald-700/50">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Mới thêm vào DB
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row">
          <div className="relative md:w-52 flex-shrink-0">
            <div className="aspect-[3/4] md:aspect-auto md:h-full bg-stone-700">
              {coverImage ? (
                <img
                  src={coverImage}
                  alt={title}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-5xl font-bold text-stone-500">{firstChar}</span>
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent md:hidden"></div>
          </div>

          <div className="flex-1 p-6 md:p-8">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-stone-700 text-stone-300 text-xs font-medium rounded-full mb-3">
                Truyện bạn đang tìm
              </span>
              
              <h2 className="text-2xl md:text-3xl font-bold text-stone-100 mb-2 leading-tight">{title}</h2>
              
              <div className="flex items-center gap-4 text-stone-400 text-sm">
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  {author || 'Unknown'}
                </span>
                <a 
                  href={originalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-stone-200 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Đọc truyện
                </a>
              </div>
            </div>

            {description && (
              <p className="text-stone-400 text-sm leading-relaxed mb-5 line-clamp-3">{description}</p>
            )}

            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                  Tags chuẩn hóa ({standardTags.length})
                </h4>
                <TagList tags={standardTags} maxVisible={8} size="md" />
              </div>

              {rawTags.length > 0 && standardTags.length !== rawTags.length && (
                <div>
                  <h4 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                    Tags gốc ({rawTags.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {rawTags.slice(0, 6).map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-stone-800/50 text-stone-500 text-xs rounded">#{tag}</span>
                    ))}
                    {rawTags.length > 6 && <span className="px-2 py-0.5 text-stone-600 text-xs">+{rawTags.length - 6} more</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
