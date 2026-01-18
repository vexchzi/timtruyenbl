/**
 * Quick probe script for Wikidich pages (HTML / anti-bot / OG metadata)
 *
 * Usage:
 *   node scripts/probeWikidich.js "https://truyenwikidich.net/truyen/..."
 */

const axios = require('axios');

async function main() {
  const url =
    process.argv[2] ||
    'https://truyenwikidich.net/truyen/xuyen-qua-chi-khi-tu-hoanh-hanh-Wsrz%7E2He7CXQTGO6';

  try {
    const res = await axios.get(url, {
      timeout: 25000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
        Connection: 'keep-alive',
      },
      // Some environments inject proxies; be explicit (like your Wattpad crawler)
      proxy: false,
      maxRedirects: 5,
      validateStatus: () => true,
    });

    const html = String(res.data || '');
    const contentType = res.headers?.['content-type'] || '';

    const hasOgTitle = html.includes('property="og:title"') || html.includes("property='og:title'");
    const hasOgDesc =
      html.includes('property="og:description"') || html.includes("property='og:description'");
    const hasOgImage = html.includes('property="og:image"') || html.includes("property='og:image'");

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const titleTag = (titleMatch?.[1] || '').replace(/\s+/g, ' ').trim();

    console.log('url:', url);
    console.log('status:', res.status);
    console.log('content-type:', contentType);
    console.log('len:', html.length);
    console.log('has_og_title:', hasOgTitle);
    console.log('has_og_desc:', hasOgDesc);
    console.log('has_og_image:', hasOgImage);
    console.log('title_tag:', titleTag.slice(0, 160));
    console.log('body_snip:', html.slice(0, 700).replace(/\s+/g, ' ').trim());
  } catch (e) {
    console.log('error:', e.response?.status || e.code || e.message);
    const body = String(e.response?.data || '');
    console.log('resp_content_type:', e.response?.headers?.['content-type']);
    console.log('body_snip:', body.slice(0, 900).replace(/\s+/g, ' ').trim());
  }
}

main();

