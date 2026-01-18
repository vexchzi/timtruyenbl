/**
 * Utility để trích xuất và làm sạch tên tác giả
 */

// Các pattern thường gặp trong tên tác giả
const AUTHOR_PREFIXES = [
  'tác giả:', 'tác giả', 'tg:', 'tg', 
  'author:', 'author', 
  'convert:', 'convert', 'cv:',
  'edit:', 'edit', 'editor:',
  'nguồn:', 'nguon:', 'src:',
  'by:', 'by',
  '-', '—', '–',
];

const AUTHOR_SUFFIXES = [
  '(edit)', '[edit]', '- edit',
  '(convert)', '[convert]', '- convert',
  '(cv)', '[cv]',
  '(full)', '[full]', '- full',
  '(hoàn)', '[hoàn]', '- hoàn',
  '(completed)', '[completed]',
];

/**
 * Trích xuất tên tác giả sạch từ chuỗi
 * @param {string} rawAuthor - Tên tác giả gốc
 * @returns {string} - Tên tác giả đã làm sạch
 */
export function cleanAuthorName(rawAuthor) {
  if (!rawAuthor || typeof rawAuthor !== 'string') {
    return 'Unknown';
  }

  let cleaned = rawAuthor.trim();

  // Remove common prefixes (case insensitive)
  for (const prefix of AUTHOR_PREFIXES) {
    const regex = new RegExp(`^${escapeRegExp(prefix)}\\s*`, 'i');
    cleaned = cleaned.replace(regex, '');
  }

  // Remove common suffixes (case insensitive)
  for (const suffix of AUTHOR_SUFFIXES) {
    const regex = new RegExp(`\\s*${escapeRegExp(suffix)}$`, 'i');
    cleaned = cleaned.replace(regex, '');
  }

  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Remove leading/trailing punctuation
  cleaned = cleaned.replace(/^[\-–—:]+\s*/, '').replace(/\s*[\-–—:]+$/, '');

  // If result is empty or just punctuation, return Unknown
  if (!cleaned || /^[\s\-–—:.,]+$/.test(cleaned)) {
    return 'Unknown';
  }

  return cleaned;
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Trích xuất tên tác giả từ title nếu author không có
 * Một số truyện có format: "Tên truyện - Tên tác giả"
 */
export function extractAuthorFromTitle(title) {
  if (!title) return null;

  // Pattern: "Tên truyện - Tác giả"
  const dashMatch = title.match(/[-–—]\s*([^-–—\[\(]+)\s*$/);
  if (dashMatch) {
    const potentialAuthor = dashMatch[1].trim();
    // Không phải tag như "Edit", "Full", "Hoàn"
    if (potentialAuthor.length > 2 && 
        !/(edit|full|hoàn|complete|cv|convert|done)/i.test(potentialAuthor)) {
      return cleanAuthorName(potentialAuthor);
    }
  }

  return null;
}

/**
 * Lấy tên tác giả tốt nhất có thể
 */
export function getBestAuthorName(novel) {
  // 1. Thử dùng author field
  let author = cleanAuthorName(novel.author);
  
  if (author && author !== 'Unknown') {
    return author;
  }

  // 2. Thử trích xuất từ title
  const fromTitle = extractAuthorFromTitle(novel.title);
  if (fromTitle) {
    return fromTitle;
  }

  // 3. Thử tìm trong description
  if (novel.description) {
    const descMatch = novel.description.match(/tác giả[:\s]+([^\n,]+)/i);
    if (descMatch) {
      return cleanAuthorName(descMatch[1]);
    }
  }

  return 'Unknown';
}

export default {
  cleanAuthorName,
  extractAuthorFromTitle,
  getBestAuthorName,
};
