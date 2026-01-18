/**
 * TagBadge - Soft & Gentle Theme
 */
export default function TagBadge({ tag, isMatching = false, size = 'md', onClick }) {
  const sizeClasses = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const baseClasses = `
    inline-flex items-center font-medium rounded-md
    transition-all duration-200
    ${sizeClasses[size]}
    ${onClick ? 'cursor-pointer' : ''}
  `;

  if (isMatching) {
    return (
      <span 
        className={`${baseClasses} bg-stone-600 text-stone-200 border border-stone-500`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
      >
        {tag}
      </span>
    );
  }

  return (
    <span 
      className={`${baseClasses} bg-stone-800 text-stone-400 border border-stone-700 hover:bg-stone-700 hover:text-stone-300`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {tag}
    </span>
  );
}

export function TagList({ tags = [], matchingTags = [], maxVisible = 6, size = 'md', onTagClick }) {
  const visibleTags = tags.slice(0, maxVisible);
  const remainingCount = tags.length - maxVisible;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleTags.map((tag, index) => (
        <TagBadge
          key={index}
          tag={tag}
          isMatching={matchingTags.includes(tag)}
          size={size}
          onClick={onTagClick ? () => onTagClick(tag) : undefined}
        />
      ))}
      {remainingCount > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-stone-800/50 text-stone-500 text-xs">
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
