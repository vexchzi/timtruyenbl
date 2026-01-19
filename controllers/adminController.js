/**
 * Admin Controller - protected endpoints to edit/delete novels.
 *
 * NOTE: Routes using this controller MUST be protected by requireAdminToken middleware.
 */

const { Novel, TagDictionary } = require('../models');
const { clearCache, normalizeString, normalizeTagsWithDescription, extractTagsFromDescription } = require('../utils/tagNormalizer');

// Import crawlers
const atlantisCrawler = require('../services/atlantisCrawler');
const gocnhoCrawler = require('../services/gocnhoCrawler');
const navyteamCrawler = require('../services/navyteamCrawler');
const wordpressCrawler = require('../services/wordpressCrawler');
const wattpadCrawler = require('../services/crawler'); // Wattpad

function normalizeTagList(tags) {
  if (!Array.isArray(tags)) return [];
  const cleaned = tags
    .map(t => (typeof t === 'string' ? t.trim() : ''))
    .filter(Boolean);

  // Deduplicate while preserving order
  const seen = new Set();
  const deduped = [];
  for (const t of cleaned) {
    if (seen.has(t)) continue;
    seen.add(t);
    deduped.push(t);
  }

  // Hard limit to avoid abuse / huge payloads
  return deduped.slice(0, 200);
}

/**
 * PUT /api/admin/novels/:id/tags
 * Body: { standardTags: string[] }
 */
async function updateNovelTags(req, res) {
  try {
    const { id } = req.params;
    const { standardTags } = req.body || {};

    const nextTags = normalizeTagList(standardTags);

    const updated = await Novel.findByIdAndUpdate(
      id,
      { $set: { standardTags: nextTags, updatedAt: new Date() } },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Novel not found',
        message: 'Không tìm thấy truyện để cập nhật.'
      });
    }

    return res.json({
      success: true,
      data: {
        novel: updated
      }
    });
  } catch (error) {
    console.error('[Admin] updateNovelTags error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * DELETE /api/admin/novels/:id
 */
async function deleteNovel(req, res) {
  try {
    const { id } = req.params;

    const deleted = await Novel.findByIdAndDelete(id).lean();
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Novel not found',
        message: 'Không tìm thấy truyện để xoá.'
      });
    }

    return res.json({
      success: true,
      data: { deletedId: id }
    });
  } catch (error) {
    console.error('[Admin] deleteNovel error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * POST /api/admin/tags
 * Body: { standardTag, category?, priority?, aliases?, description? }
 *
 * Creates a brand new standardTag entry in TagDictionary.
 */
async function createTag(req, res) {
  try {
    const {
      standardTag,
      category = 'other',
      priority = 5,
      aliases = [],
      description = ''
    } = req.body || {};

    const trimmedStandardTag = typeof standardTag === 'string' ? standardTag.trim() : '';
    if (!trimmedStandardTag) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'standardTag là bắt buộc.'
      });
    }

    // Disallow creating banned tags from admin UI too (consistent with app policy)
    const banned = new Set(['Bách Hợp', 'Ngôn Tình']);
    if (banned.has(trimmedStandardTag)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: `Không cho phép tạo tag "${trimmedStandardTag}".`
      });
    }

    const allowedCategories = new Set([
      'genre',
      'setting',
      'ending',
      'relationship',
      'content',
      'character',
      'other'
    ]);
    const safeCategory = allowedCategories.has(category) ? category : 'other';

    const nPriority = Math.max(1, Math.min(10, parseInt(priority, 10) || 5));

    // Keyword must be normalized (lowercase + no tones) and unique.
    const keyword = normalizeString(trimmedStandardTag);
    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'standardTag không hợp lệ để tạo keyword.'
      });
    }

    // Ensure "brand new": reject if standardTag already exists (active)
    const existingStd = await TagDictionary.findOne({
      standardTag: trimmedStandardTag,
      isActive: true
    }).select('_id standardTag').lean();

    if (existingStd) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'Tag này đã tồn tại trong TagDictionary.'
      });
    }

    // Reject if keyword collides
    const existingKeyword = await TagDictionary.findOne({ keyword }).select('_id keyword standardTag').lean();
    if (existingKeyword) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'Keyword bị trùng (đã có entry khác). Hãy đổi tên tag.'
      });
    }

    const aliasListRaw = Array.isArray(aliases)
      ? aliases
      : (typeof aliases === 'string' ? aliases.split(/[,;\n]+/) : []);

    const aliasSet = new Set();
    for (const a of aliasListRaw) {
      if (typeof a !== 'string') continue;
      const t = a.trim();
      if (!t) continue;

      const lower = t.toLowerCase();
      aliasSet.add(lower);

      const norm = normalizeString(t);
      if (norm && norm !== lower) aliasSet.add(norm);
    }

    // Also add the standardTag itself as an alias (helps matching user input)
    aliasSet.add(trimmedStandardTag.toLowerCase());
    aliasSet.add(keyword);

    const entry = await TagDictionary.create({
      keyword,
      standardTag: trimmedStandardTag,
      category: safeCategory,
      priority: nPriority,
      aliases: Array.from(aliasSet).slice(0, 200),
      description: typeof description === 'string' ? description.trim() : ''
    });

    // Ensure new dictionary is picked up immediately
    clearCache();

    return res.json({
      success: true,
      data: {
        tag: {
          _id: entry._id,
          keyword: entry.keyword,
          standardTag: entry.standardTag,
          category: entry.category,
          priority: entry.priority,
          aliases: entry.aliases,
          description: entry.description,
          isActive: entry.isActive
        }
      }
    });
  } catch (error) {
    // Handle duplicate key error (keyword unique)
    if (error && error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Conflict',
        message: 'Keyword bị trùng (unique index).'
      });
    }

    console.error('[Admin] createTag error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/admin/tags
 * Get all tags from TagDictionary
 */
async function getAllTags(req, res) {
  try {
    const tags = await TagDictionary.find({ isActive: true })
      .sort({ category: 1, priority: -1, standardTag: 1 })
      .lean();

    return res.json({
      success: true,
      data: {
        tags,
        total: tags.length
      }
    });
  } catch (error) {
    console.error('[Admin] getAllTags error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * PUT /api/admin/tags/:id
 * Update an existing tag
 */
async function updateTag(req, res) {
  try {
    const { id } = req.params;
    const {
      standardTag,
      category,
      priority,
      aliases,
      description
    } = req.body || {};

    const tag = await TagDictionary.findById(id);
    if (!tag) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found'
      });
    }

    const oldTagName = tag.standardTag;
    let tagRenamed = false;

    // Update fields if provided
    if (standardTag && standardTag.trim()) {
      const trimmed = standardTag.trim();
      // Check if new name conflicts with existing tag
      if (trimmed !== tag.standardTag) {
        const existing = await TagDictionary.findOne({
          standardTag: trimmed,
          _id: { $ne: id },
          isActive: true
        });
        if (existing) {
          return res.status(409).json({
            success: false,
            error: 'Conflict',
            message: 'Tag với tên này đã tồn tại.'
          });
        }
        tag.standardTag = trimmed;
        tag.keyword = normalizeString(trimmed);
        tagRenamed = true;
      }
    }

    if (category) {
      const allowedCategories = ['genre', 'setting', 'ending', 'relationship', 'content', 'character', 'other'];
      if (allowedCategories.includes(category)) {
        tag.category = category;
      }
    }

    if (priority !== undefined) {
      tag.priority = Math.max(1, Math.min(10, parseInt(priority, 10) || 5));
    }

    if (aliases !== undefined) {
      const aliasListRaw = Array.isArray(aliases)
        ? aliases
        : (typeof aliases === 'string' ? aliases.split(/[,;\n]+/) : []);

      const aliasSet = new Set();
      for (const a of aliasListRaw) {
        if (typeof a !== 'string') continue;
        const t = a.trim();
        if (!t) continue;
        aliasSet.add(t.toLowerCase());
        const norm = normalizeString(t);
        if (norm) aliasSet.add(norm);
      }
      // Always include the standardTag itself
      aliasSet.add(tag.standardTag.toLowerCase());
      aliasSet.add(tag.keyword);

      tag.aliases = Array.from(aliasSet).slice(0, 200);
    }

    if (description !== undefined) {
      tag.description = typeof description === 'string' ? description.trim() : '';
    }

    await tag.save();
    clearCache();

    // If tag was renamed, update all novels that use this tag
    let novelsUpdated = 0;
    if (tagRenamed && oldTagName !== tag.standardTag) {
      const result = await Novel.updateMany(
        { standardTags: oldTagName },
        { $set: { 'standardTags.$[elem]': tag.standardTag } },
        { arrayFilters: [{ elem: oldTagName }] }
      );
      novelsUpdated = result.modifiedCount;
      console.log(`[Admin] Renamed tag "${oldTagName}" -> "${tag.standardTag}", updated ${novelsUpdated} novels`);
    }

    return res.json({
      success: true,
      data: {
        tag,
        novelsUpdated: tagRenamed ? novelsUpdated : 0
      }
    });
  } catch (error) {
    console.error('[Admin] updateTag error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * DELETE /api/admin/tags/:id
 * Delete (deactivate) a tag
 */
async function deleteTag(req, res) {
  try {
    const { id } = req.params;

    const tag = await TagDictionary.findById(id);
    if (!tag) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found'
      });
    }

    // Soft delete by setting isActive to false
    tag.isActive = false;
    await tag.save();
    clearCache();

    return res.json({
      success: true,
      data: { deletedId: id, standardTag: tag.standardTag }
    });
  } catch (error) {
    console.error('[Admin] deleteTag error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * POST /api/admin/novels/auto-tag
 * Body: { limit?: number, dryRun?: boolean }
 * 
 * Automatically tag novels that have no standardTags
 * Uses rawTags and description to generate tags
 */
async function autoTagNovels(req, res) {
  try {
    const { limit = 100, dryRun = false } = req.body || {};
    const maxLimit = Math.min(parseInt(limit, 10) || 100, 500);

    // Find novels without standardTags
    const novels = await Novel.find({
      $or: [
        { standardTags: { $exists: false } },
        { standardTags: { $size: 0 } },
        { standardTags: null }
      ]
    })
      .limit(maxLimit)
      .select('_id title rawTags description standardTags')
      .lean();

    if (novels.length === 0) {
      return res.json({
        success: true,
        data: {
          message: 'Không có truyện nào cần gắn tag.',
          processed: 0,
          tagged: 0,
          remaining: 0
        }
      });
    }

    // Count total remaining
    const totalWithoutTags = await Novel.countDocuments({
      $or: [
        { standardTags: { $exists: false } },
        { standardTags: { $size: 0 } },
        { standardTags: null }
      ]
    });

    const results = [];
    let taggedCount = 0;

    for (const novel of novels) {
      try {
        // Use normalizeTagsWithDescription to extract tags from rawTags + description
        const newTags = await normalizeTagsWithDescription(
          novel.rawTags || [],
          novel.description || ''
        );

        if (newTags.length > 0) {
          if (!dryRun) {
            await Novel.findByIdAndUpdate(novel._id, {
              $set: { standardTags: newTags, updatedAt: new Date() }
            });
          }
          taggedCount++;
          results.push({
            id: novel._id,
            title: novel.title,
            tagsAdded: newTags.length,
            tags: newTags,
            rawTagsCount: (novel.rawTags || []).length,
            descLength: (novel.description || '').length
          });
        } else {
          // Show why it couldn't be tagged
          const rawTags = novel.rawTags || [];
          const desc = novel.description || '';
          const descExtracted = extractTagsFromDescription(desc);

          results.push({
            id: novel._id,
            title: novel.title,
            tagsAdded: 0,
            tags: [],
            rawTagsCount: rawTags.length,
            rawTagsSample: rawTags.slice(0, 10),
            descLength: desc.length,
            descExtracted: descExtracted.slice(0, 5), // Tags extracted from description format
            descSample: desc.substring(0, 200), // First 200 chars of description
            reason: rawTags.length === 0 && desc.length < 50
              ? 'Không có rawTags và description quá ngắn'
              : rawTags.length === 0
                ? 'Không có rawTags, description không chứa từ khóa'
                : 'rawTags và description không khớp TagDictionary'
          });
        }
      } catch (err) {
        console.error(`[AutoTag] Error processing novel ${novel._id}:`, err.message);
        results.push({
          id: novel._id,
          title: novel.title,
          error: err.message
        });
      }
    }

    return res.json({
      success: true,
      data: {
        message: dryRun ? 'Dry run - không có thay đổi được lưu' : 'Đã gắn tag tự động',
        processed: novels.length,
        tagged: taggedCount,
        remaining: totalWithoutTags - (dryRun ? 0 : taggedCount),
        dryRun,
        results
      }
    });
  } catch (error) {
    console.error('[Admin] autoTagNovels error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * POST /api/admin/novels/retag-all
 * Body: { dryRun?: boolean }
 * 
 * Re-tag ALL novels (including those that already have tags)
 * Uses rawTags and description to regenerate tags
 * Processes ALL novels in batches of 100
 */
async function retagAllNovels(req, res) {
  try {
    const { dryRun = false } = req.body || {};
    const batchSize = 100;

    // Count total with rawTags
    const totalWithRawTags = await Novel.countDocuments({
      rawTags: { $exists: true, $not: { $size: 0 } }
    });

    if (totalWithRawTags === 0) {
      return res.json({
        success: true,
        data: {
          message: 'Không có truyện nào có rawTags để xử lý.',
          processed: 0,
          updated: 0,
          unchanged: 0
        }
      });
    }

    console.log(`[RetagAll] Starting re-tag of ${totalWithRawTags} novels...`);

    let processed = 0;
    let updatedCount = 0;
    let unchangedCount = 0;
    let errorCount = 0;
    const sampleChanges = [];

    // Process ALL novels using cursor for memory efficiency
    const cursor = Novel.find({
      rawTags: { $exists: true, $not: { $size: 0 } }
    })
      .select('_id title rawTags description standardTags')
      .cursor();

    let batch = [];

    for await (const novel of cursor) {
      batch.push(novel);

      if (batch.length >= batchSize) {
        // Process batch
        const result = await processBatch(batch, dryRun, sampleChanges);
        updatedCount += result.updated;
        unchangedCount += result.unchanged;
        errorCount += result.errors;
        processed += batch.length;

        console.log(`[RetagAll] Processed ${processed}/${totalWithRawTags} (${updatedCount} updated)`);
        batch = [];
      }
    }

    // Process remaining
    if (batch.length > 0) {
      const result = await processBatch(batch, dryRun, sampleChanges);
      updatedCount += result.updated;
      unchangedCount += result.unchanged;
      errorCount += result.errors;
      processed += batch.length;
    }

    console.log(`[RetagAll] Completed! Processed: ${processed}, Updated: ${updatedCount}, Unchanged: ${unchangedCount}, Errors: ${errorCount}`);

    return res.json({
      success: true,
      data: {
        message: dryRun ? 'Dry run - không có thay đổi được lưu' : 'Đã re-tag TẤT CẢ truyện',
        processed,
        updated: updatedCount,
        unchanged: unchangedCount,
        errors: errorCount,
        totalWithRawTags,
        dryRun,
        sampleChanges: sampleChanges.slice(0, 30)
      }
    });
  } catch (error) {
    console.error('[Admin] retagAllNovels error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

// Helper function to process a batch of novels for retagging
async function processBatch(novels, dryRun, sampleChanges) {
  let updated = 0;
  let unchanged = 0;
  let errors = 0;

  for (const novel of novels) {
    try {
      const newTags = await normalizeTagsWithDescription(
        novel.rawTags || [],
        novel.description || ''
      );

      const oldTags = novel.standardTags || [];
      const oldSet = new Set(oldTags);
      const newSet = new Set(newTags);

      const added = newTags.filter(t => !oldSet.has(t));
      const removed = oldTags.filter(t => !newSet.has(t));

      if (added.length > 0 || removed.length > 0) {
        if (!dryRun) {
          await Novel.findByIdAndUpdate(novel._id, {
            $set: { standardTags: newTags, updatedAt: new Date() }
          });
        }
        updated++;

        // Keep sample changes (limit to 30)
        if (sampleChanges.length < 30) {
          sampleChanges.push({
            id: novel._id,
            title: novel.title,
            oldTags: oldTags.slice(0, 8),
            newTags: newTags.slice(0, 8),
            added: added.slice(0, 5),
            removed: removed.slice(0, 5)
          });
        }
      } else {
        unchanged++;
      }
    } catch (err) {
      console.error(`[RetagAll] Error processing novel ${novel._id}:`, err.message);
      errors++;
    }
  }

  return { updated, unchanged, errors };
}

/**
 * GET /api/admin/novels/stats
 * Get stats about novels without tags
 */
async function getNovelStats(req, res) {
  try {
    const totalNovels = await Novel.countDocuments();
    const novelsWithoutTags = await Novel.countDocuments({
      $or: [
        { standardTags: { $exists: false } },
        { standardTags: { $size: 0 } },
        { standardTags: null }
      ]
    });
    const novelsWithTags = totalNovels - novelsWithoutTags;

    return res.json({
      success: true,
      data: {
        total: totalNovels,
        withTags: novelsWithTags,
        withoutTags: novelsWithoutTags,
        taggedPercent: totalNovels > 0
          ? ((novelsWithTags / totalNovels) * 100).toFixed(1) + '%'
          : '0%'
      }
    });
  } catch (error) {
    console.error('[Admin] getNovelStats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * POST /api/admin/novels/:id/recrawl
 * Re-crawl novel from original source to get fresh data
 */
async function recrawlNovel(req, res) {
  try {
    const { id } = req.params;

    const novel = await Novel.findById(id);
    if (!novel) {
      return res.status(404).json({
        success: false,
        error: 'Novel not found',
        message: 'Không tìm thấy truyện.'
      });
    }

    if (!novel.originalLink) {
      return res.status(400).json({
        success: false,
        error: 'No source link',
        message: 'Truyện không có link nguồn gốc để crawl lại.'
      });
    }

    const url = novel.originalLink;
    const source = novel.source || '';
    let crawledData = null;

    console.log(`[Admin] Re-crawling novel: ${novel.title} from ${source}`);

    // Determine which crawler to use based on source or URL
    try {
      if (source === 'atlantis' || url.includes('atlantisviendong.com')) {
        crawledData = await atlantisCrawler.crawlNovelDetail(url);
      } else if (source === 'gocnho' || url.includes('gocnho.me') || url.includes('gocnho.net')) {
        crawledData = await gocnhoCrawler.crawlNovelDetail(url);
      } else if (source === 'navyteam' || url.includes('navyteamtrans')) {
        crawledData = await navyteamCrawler.crawlNovelDetail(url);
      } else if (source === 'wattpad' || url.includes('wattpad.com')) {
        // Wattpad crawler
        crawledData = await wattpadCrawler.crawlWattpad(url);
      } else if (source === 'wordpress' || url.includes('wordpress')) {
        // WordPress crawler
        crawledData = await wordpressCrawler.crawlSinglePost(url);
      } else {
        // Try wordpress crawler as fallback for unknown sources
        console.log(`[Admin] Unknown source "${source}", trying WordPress crawler`);
        crawledData = await wordpressCrawler.crawlSinglePost(url);
      }
    } catch (crawlErr) {
      console.error(`[Admin] Crawl error:`, crawlErr);
      return res.status(500).json({
        success: false,
        error: 'Crawl failed',
        message: `Lỗi khi crawl: ${crawlErr.message}`
      });
    }

    if (!crawledData) {
      return res.status(500).json({
        success: false,
        error: 'Crawl returned no data',
        message: 'Không thể lấy dữ liệu từ nguồn. Trang có thể đã bị xóa hoặc thay đổi cấu trúc.'
      });
    }

    // Update novel with new data (only update fields that have data)
    const updateFields = { updatedAt: new Date() };

    if (crawledData.description && crawledData.description.trim()) {
      updateFields.description = crawledData.description.trim();
    }
    if (crawledData.author && crawledData.author !== 'Unknown') {
      updateFields.author = crawledData.author;
    }
    if (crawledData.coverImage) {
      updateFields.coverImage = crawledData.coverImage;
    }
    if (crawledData.rawTags && crawledData.rawTags.length > 0) {
      updateFields.rawTags = crawledData.rawTags;
    }
    if (crawledData.chapterCount && crawledData.chapterCount > 0) {
      updateFields.chapterCount = crawledData.chapterCount;
    }
    if (crawledData.status && crawledData.status !== 'unknown') {
      updateFields.status = crawledData.status;
    }

    // Also regenerate standardTags from new rawTags + description
    if (updateFields.rawTags || updateFields.description) {
      const newStandardTags = await normalizeTagsWithDescription(
        updateFields.rawTags || novel.rawTags || [],
        updateFields.description || novel.description || ''
      );
      if (newStandardTags.length > 0) {
        // Merge with existing tags, don't replace
        const existingTags = new Set(novel.standardTags || []);
        newStandardTags.forEach(t => existingTags.add(t));
        updateFields.standardTags = Array.from(existingTags);
      }
    }

    const updatedNovel = await Novel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    ).lean();

    console.log(`[Admin] Re-crawled novel "${novel.title}": updated fields`, Object.keys(updateFields));

    return res.json({
      success: true,
      data: {
        novel: updatedNovel,
        updatedFields: Object.keys(updateFields).filter(k => k !== 'updatedAt'),
        message: 'Đã crawl lại thành công!'
      }
    });

  } catch (error) {
    console.error('[Admin] recrawlNovel error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * GET /api/admin/novels/search-keyword
 * Query: { keyword, searchIn: 'all'|'description'|'rawTags'|'title'|'noTag', limit }
 * 
 * Search novels by keyword in specific fields
 */
async function searchByKeyword(req, res) {
  try {
    const { keyword, searchIn = 'all', limit = 500 } = req.query;

    if (!keyword || keyword.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Keyword too short',
        message: 'Từ khóa phải có ít nhất 2 ký tự'
      });
    }

    const kw = keyword.trim();
    const maxLimit = Math.min(parseInt(limit, 10) || 500, 1000);

    // Build regex for search (case-insensitive)
    const regex = new RegExp(kw, 'i');

    // Build query based on searchIn
    let query = {};
    let projection = 'title author description rawTags standardTags originalLink source';

    switch (searchIn) {
      case 'title':
        query = { title: regex };
        break;
      case 'description':
        query = { description: regex };
        break;
      case 'rawTags':
        query = { rawTags: regex };
        break;
      case 'noTag':
        // Has keyword in description or rawTags, but NOT in standardTags
        query = {
          $and: [
            {
              $or: [
                { description: regex },
                { rawTags: regex }
              ]
            },
            {
              standardTags: { $not: regex }
            }
          ]
        };
        break;
      case 'all':
      default:
        query = {
          $or: [
            { title: regex },
            { description: regex },
            { rawTags: regex }
          ]
        };
        break;
    }

    console.log(`[Admin] Keyword search: "${kw}" in ${searchIn}`);

    const novels = await Novel.find(query)
      .select(projection)
      .limit(maxLimit)
      .sort({ createdAt: -1 })
      .lean();

    // Count total (without limit)
    const total = await Novel.countDocuments(query);

    console.log(`[Admin] Found ${novels.length}/${total} novels for keyword "${kw}"`);

    return res.json({
      success: true,
      data: {
        novels,
        total,
        returned: novels.length,
        keyword: kw,
        searchIn
      }
    });

  } catch (error) {
    console.error('[Admin] searchByKeyword error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

// ============== Tag Reports Management ==============

const { TagReport } = require('../models');

/**
 * GET /api/admin/reports/stats
 * Get statistics about tag reports
 */
async function getReportStats(req, res) {
  try {
    const stats = await TagReport.getStats();

    return res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[Admin] getReportStats error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * GET /api/admin/reports
 * Get all reports with pagination
 * Query: status, page, limit
 */
async function getReports(req, res) {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;

    const result = await TagReport.getReportsWithNovel({
      status,
      page: parseInt(page, 10) || 1,
      limit: Math.min(parseInt(limit, 10) || 20, 100)
    });

    return res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Admin] getReports error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * PUT /api/admin/reports/:id/status
 * Update report status
 * Body: { status, adminNote? }
 */
async function updateReportStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body || {};

    const validStatuses = ['pending', 'reviewed', 'resolved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: `Status phải là một trong: ${validStatuses.join(', ')}`
      });
    }

    const updateData = { status };
    if (adminNote) {
      updateData.adminNote = adminNote;
    }
    if (status === 'resolved' || status === 'rejected') {
      updateData.resolvedAt = new Date();
    }

    const report = await TagReport.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).populate('novelId', 'title');

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    console.log(`[Admin] Updated report ${id} status to ${status}`);

    return res.json({
      success: true,
      data: { report }
    });
  } catch (error) {
    console.error('[Admin] updateReportStatus error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * POST /api/admin/reports/:id/resolve
 * Resolve report and optionally update novel tags
 * Body: { newTags?, adminNote? }
 */
async function resolveReport(req, res) {
  try {
    const { id } = req.params;
    const { newTags, adminNote } = req.body || {};

    const report = await TagReport.findById(id).populate('novelId');
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Update novel tags if provided
    let novelUpdated = false;
    if (Array.isArray(newTags) && report.novelId) {
      await Novel.findByIdAndUpdate(report.novelId._id, {
        $set: {
          standardTags: newTags.slice(0, 200),
          updatedAt: new Date()
        }
      });
      novelUpdated = true;
      console.log(`[Admin] Updated tags for novel ${report.novelId._id}`);
    }

    // Update report status
    report.status = 'resolved';
    report.resolvedAt = new Date();
    if (adminNote) {
      report.adminNote = adminNote;
    }
    await report.save();

    console.log(`[Admin] Resolved report ${id}`);

    return res.json({
      success: true,
      data: {
        report,
        novelUpdated
      }
    });
  } catch (error) {
    console.error('[Admin] resolveReport error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * DELETE /api/admin/reports/:id
 * Delete a report
 */
async function deleteReport(req, res) {
  try {
    const { id } = req.params;

    const report = await TagReport.findByIdAndDelete(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    console.log(`[Admin] Deleted report ${id}`);

    return res.json({
      success: true,
      data: { deletedId: id }
    });
  } catch (error) {
    console.error('[Admin] deleteReport error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

// ============== Site Notice Management ==============

const { SiteNotice } = require('../models');

/**
 * GET /api/admin/notice
 * Get current site notice
 */
async function getNotice(req, res) {
  try {
    const notice = await SiteNotice.getCurrent();

    return res.json({
      success: true,
      data: notice
    });
  } catch (error) {
    console.error('[Admin] getNotice error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * PUT /api/admin/notice
 * Update site notice
 * Body: { title?, content?, isActive? }
 */
async function updateNotice(req, res) {
  try {
    const { title, content, isActive } = req.body || {};

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (isActive !== undefined) updateData.isActive = isActive;

    const notice = await SiteNotice.updateNotice(updateData);

    console.log(`[Admin] Updated site notice - Active: ${notice.isActive}`);

    return res.json({
      success: true,
      data: notice
    });
  } catch (error) {
    console.error('[Admin] updateNotice error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

module.exports = {
  updateNovelTags,
  deleteNovel,
  createTag,
  getAllTags,
  updateTag,
  deleteTag,
  autoTagNovels,
  retagAllNovels,
  getNovelStats,
  recrawlNovel,
  searchByKeyword,
  // Report management
  getReportStats,
  getReports,
  updateReportStatus,
  resolveReport,
  deleteReport,
  // Site notice management
  getNotice,
  updateNotice
};


