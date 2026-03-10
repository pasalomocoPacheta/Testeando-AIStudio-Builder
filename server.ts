/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import { createServer as createViteServer } from "vite";
import { builder } from "@builder.io/sdk";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

// Initialize Builder with the provided API Key
const BUILDER_API_KEY = 'f450ca45929045f782ca4fdfb394abb9';
const GLOBAL_THEME_MODEL = 'global-css';
const GLOBAL_THEME_ENTRY_ID = '993e7845a53244f9ab8cae40bb7bb2fd';
builder.init(BUILDER_API_KEY);

// Simple in-memory cache
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function escapeHtml(value: string | undefined | null) {
  if (!value) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeCssValue(value: unknown, fallback = '') {
  const safe = value ?? fallback;
  return String(safe).replace(/<\/style/gi, '<\\/style').trim();
}

async function getGlobalThemeEntry() {
  const cacheKey = 'builder-global-theme';

  const cached = cache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  try {
    let entry = null;
    
    // 1. Try fetching by ID first as it's more specific
    if (GLOBAL_THEME_ENTRY_ID) {
      console.log(`Fetching theme by ID: ${GLOBAL_THEME_ENTRY_ID}`);
      entry = await builder.get(GLOBAL_THEME_MODEL, {
        entry: GLOBAL_THEME_ENTRY_ID,
        options: {
          noTargeting: true,
        },
      }).toPromise();
    }

    // 2. Fallback: Fetch the latest entry of the model if ID fetch failed or no ID
    if (!entry) {
      console.log(`ID fetch failed or no ID, fetching latest from model: ${GLOBAL_THEME_MODEL}`);
      entry = await builder.get(GLOBAL_THEME_MODEL, {
        options: {
          noTargeting: true,
        },
      }).toPromise();
    }

    const data = entry?.data || null;
    if (data) {
      console.log('Successfully fetched global theme from Builder');
    } else {
      console.warn('Global theme entry found but data is empty');
    }
    
    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error('Error fetching global theme from Builder:', error);
    return null;
  }
}

function buildGlobalThemeCss(data: Record<string, any> | null | undefined) {
  const templatePath = path.resolve('.', 'src/globals.css');
  let css = '';
  try {
    css = fs.readFileSync(templatePath, 'utf-8');
  } catch (e) {
    console.error('Could not read globals.css template:', e);
    return '/* Error loading template */';
  }

  const themeData = data || {};

  // Replacements mapping tokens in globals.css to Builder.io data
  const replacements: Record<string, string> = {
    '[FONT_HEADING_FAMILY]': themeData.fontHeadingFamily || 'TTRamillas',
    '[FONT_HEADING_FALLBACK]': themeData.fontHeadingFallback || 'serif',
    '[FONT_BODY_FAMILY]': themeData.fontBodyFamily || 'Belfast Grotesk',
    '[FONT_BODY_FALLBACK]': themeData.fontBodyFallback || 'sans-serif',
    '[COLOR_PRIMARY]': escapeCssValue(themeData.colorPrimary, '#1C0445'),
    '[COLOR_SECONDARY]': escapeCssValue(themeData.colorSecondary, '#FFFFFF'),
    '[COLOR_ACCENT]': escapeCssValue(themeData.colorAccent, '#FFD100'),
    '[COLOR_INFO]': escapeCssValue(themeData.colorInfo, '#0C6FF9'),
    '[COLOR_MUTED]': escapeCssValue(themeData.colorMuted, '#F2F0EF'),
    '[COLOR_SURFACE]': escapeCssValue(themeData.colorSurface, '#FCFCFC'),
    '[COLOR_DISABLED_TEXT]': escapeCssValue(themeData.colorDisabledText, '#A0A0A0'),
    '[COLOR_DISABLED_BG]': escapeCssValue(themeData.colorDisabledBg, '#E5E5E5'),
    '[RADIUS_BUTTON]': escapeCssValue(themeData.buttonRadius, '37px'),
    '[RADIUS_INPUT]': escapeCssValue(themeData.inputRadius, '8px'),
    '[TRANSITION_FAST]': escapeCssValue(themeData.transitionFast, 'all 0.2s ease'),
    '[PALETTE_VIOLET]': escapeCssValue(themeData.paletteViolet, '#9C66FD'),
    '[PALETTE_ROSE]': escapeCssValue(themeData.paletteRose, '#F12E70'),
    '[PALETTE_BLUSH]': escapeCssValue(themeData.paletteBlush, '#FFA2B8'),
    '[PALETTE_PEACH]': escapeCssValue(themeData.palettePeach, '#FDBFA2'),
    '[PALETTE_MAGENTA]': escapeCssValue(themeData.paletteMagenta, '#E700FF'),
    '[PALETTE_PURPLE]': escapeCssValue(themeData.palettePurple, '#AE1ED8'),
    '[PALETTE_INDIGO]': escapeCssValue(themeData.paletteIndigo, '#331C9D'),
    '[PALETTE_CORAL]': escapeCssValue(themeData.paletteCoral, '#FC707D'),
    '[PALETTE_PINK]': escapeCssValue(themeData.palettePink, '#FF2EAF'),
    '[PALETTE_BLUE]': escapeCssValue(themeData.paletteBlue, '#2E58FF'),
    '[PALETTE_HUBSPOT_YELLOW]': escapeCssValue(themeData.paletteHubspotYellowAlt, '#FCD100'),
    '[BODY_FONT_SIZE]': escapeCssValue(themeData.bodyFontSize, '1rem'),
    '[BODY_LINE_HEIGHT]': escapeCssValue(themeData.bodyLineHeight, '1.7'),
    '[BODY_FONT_WEIGHT]': escapeCssValue(themeData.bodyFontWeight, '400'),
    '[BODY_TEXT_COLOR]': escapeCssValue(themeData.bodyTextColor, '#1C0445'),
    '[BODY_BACKGROUND]': escapeCssValue(themeData.bodyBackground, '#FCFCFC'),
    '[H1_FONT_SIZE]': escapeCssValue(themeData.h1FontSize, '3rem'),
    '[H1_LINE_HEIGHT]': escapeCssValue(themeData.h1LineHeight, '1.1'),
    '[H1_WEIGHT]': escapeCssValue(themeData.h1Weight, '700'),
    '[H2_FONT_SIZE]': escapeCssValue(themeData.h2FontSize, '2.4rem'),
    '[H2_LINE_HEIGHT]': escapeCssValue(themeData.h2LineHeight, '1.15'),
    '[H2_WEIGHT]': escapeCssValue(themeData.h2Weight, '700'),
    '[H3_FONT_SIZE]': escapeCssValue(themeData.h3FontSize, '2.25rem'),
    '[H3_LINE_HEIGHT]': escapeCssValue(themeData.h3LineHeight, '1.2'),
    '[H3_WEIGHT]': escapeCssValue(themeData.h3Weight, '700'),
    '[H4_FONT_SIZE]': escapeCssValue(themeData.h4FontSize, '1.875rem'),
    '[H4_LINE_HEIGHT]': escapeCssValue(themeData.h4LineHeight, '1.25'),
    '[H4_WEIGHT]': escapeCssValue(themeData.h4Weight, '700'),
    '[H5_FONT_SIZE]': escapeCssValue(themeData.h5FontSize, '1.375rem'),
    '[H5_LINE_HEIGHT]': escapeCssValue(themeData.h5LineHeight, '1.3'),
    '[H5_WEIGHT]': escapeCssValue(themeData.h5Weight, '700'),
    '[H6_FONT_SIZE]': escapeCssValue(themeData.h6FontSize, '1.25rem'),
    '[H6_LINE_HEIGHT]': escapeCssValue(themeData.h6LineHeight, '1.35'),
    '[H6_WEIGHT]': escapeCssValue(themeData.h6Weight, '700'),
    '[PARAGRAPH_FONT_SIZE]': escapeCssValue(themeData.paragraphFontSize, '1rem'),
    '[PARAGRAPH_LINE_HEIGHT]': escapeCssValue(themeData.paragraphLineHeight, '1.7'),
    '[SMALL_FONT_SIZE]': escapeCssValue(themeData.smallFontSize, '0.875rem'),
    '[SMALL_LINE_HEIGHT]': escapeCssValue(themeData.smallLineHeight, '1.7'),
    '[LABEL_COLOR]': escapeCssValue(themeData.labelColor, '#1C0445'),
    '[LINK_COLOR]': escapeCssValue(themeData.linkColor, '#1C0445'),
    '[LINK_DECORATION]': escapeCssValue(themeData.linkDecoration, 'none'),
    '[LINK_HOVER_COLOR]': escapeCssValue(themeData.linkHoverColor, '#FFD100'),
    '[BUTTON_FONT_FAMILY]': themeData.buttonFontFamily || themeData.fontBodyFamily || 'Belfast Grotesk',
    '[BUTTON_FONT_WEIGHT]': escapeCssValue(themeData.buttonFontWeight, '600'),
    '[BUTTON_BACKGROUND]': escapeCssValue(themeData.buttonBackground, '#1C0445'),
    '[BUTTON_TEXT_COLOR]': escapeCssValue(themeData.buttonTextColor, '#FFFFFF'),
    '[BUTTON_BORDER]': escapeCssValue(themeData.buttonBorder, '1px solid #1C0445'),
    '[BUTTON_PADDING_TOP]': escapeCssValue(themeData.buttonPaddingTop, '12px'),
    '[BUTTON_PADDING_RIGHT]': escapeCssValue(themeData.buttonPaddingRight, '24px'),
    '[BUTTON_PADDING_BOTTOM]': escapeCssValue(themeData.buttonPaddingBottom, '12px'),
    '[BUTTON_PADDING_LEFT]': escapeCssValue(themeData.buttonPaddingLeft, '24px'),
    '[INPUT_TEXT_COLOR]': escapeCssValue(themeData.inputTextColor, '#1C0445'),
    '[INPUT_BORDER]': escapeCssValue(themeData.inputBorder, '1px solid #1C0445'),
    '[INPUT_BACKGROUND]': escapeCssValue(themeData.inputBackground, '#FFFFFF'),
    '[TEXTAREA_TEXT_COLOR]': escapeCssValue(themeData.textareaTextColor, '#1C0445'),
    '[TEXTAREA_BORDER]': escapeCssValue(themeData.textareaBorder, '1px solid #1C0445'),
    '[TEXTAREA_BACKGROUND]': escapeCssValue(themeData.textareaBackground, '#FFFFFF'),
    '[SELECT_TEXT_COLOR]': escapeCssValue(themeData.selectTextColor, '#1C0445'),
    '[SELECT_BORDER]': escapeCssValue(themeData.selectBorder, '1px solid #1C0445'),
    '[SELECT_BACKGROUND]': escapeCssValue(themeData.selectBackground, '#FFFFFF'),
  };

  for (const [token, value] of Object.entries(replacements)) {
    css = css.split(token).join(value);
  }

  return css;
}

function injectGlobalThemeCss(html: string) {
  const $ = cheerio.load(html);
  $('#builder-global-theme').remove();
  // Inject a link to the dynamic globals.css route at the end of the body 
  // to ensure it overrides Tailwind CSS and other head-injected styles.
  const timestamp = Date.now();
  $('body').append(`\n<link rel="stylesheet" id="builder-global-theme" href="/globals.css?t=${timestamp}">\n`);
  return $.html();
}

async function fetchAndSanitizeGoogleDoc(url: string) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Google Docs published HTML structure:
    // #header, #contents, #footer
    // We only want #contents
    let contentHtml = $('#contents').html();
    
    // Fallback to body if #contents is not found
    if (!contentHtml) {
      contentHtml = $('body').html() || '';
    }

    const $content = cheerio.load(contentHtml);

    // 1. Remove Google's default junk
    $content('style, script, meta, title, #header, #footer').remove();
    
    // Remove the "Published using Google Docs" footer specifically if it escaped
    $content('div:contains("Published using Google Docs")').remove();
    $content('div:contains("Updated automatically every 5 minutes")').remove();

    // 2. Transform YouTube links to embeds
    $content('a').each((_, el) => {
      const href = $content(el).attr('href');
      if (href) {
        // Handle Google's redirect URLs (e.g., https://www.google.com/url?q=...)
        let actualUrl = href;
        if (href.includes('google.com/url?q=')) {
          const urlObj = new URL(href);
          actualUrl = urlObj.searchParams.get('q') || href;
        }

        const youtubeMatch = actualUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (youtubeMatch) {
          const videoId = youtubeMatch[1];
          $content(el).replaceWith(`
            <div class="aspect-video w-full my-8 rounded-2xl overflow-hidden shadow-2xl">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/${videoId}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen
              ></iframe>
            </div>
          `);
        } else {
          $content(el).attr('href', actualUrl);
          $content(el).attr('target', '_blank');
          $content(el).attr('rel', 'noopener noreferrer');
        }
      }
    });

    // 3. Improve Image Handling - Convert to Base64 for 100% reliability
    const baseUrlObj = new URL(url);
    const baseDir = url.substring(0, url.lastIndexOf('/') + 1);

    const imgPromises: Promise<void>[] = [];

    $content('img').each((_, el) => {
      const $img = $content(el);
      const src = $img.attr('src');
      
      if (src) {
        let absoluteSrc = src;
        if (!src.startsWith('http') && !src.startsWith('data:')) {
          if (src.startsWith('/')) {
            absoluteSrc = `${baseUrlObj.origin}${src}`;
          } else {
            absoluteSrc = `${baseDir}${src}`;
          }
        }

        // Fetch image and convert to base64 on the server
        const promise = fetch(absoluteSrc)
          .then(async res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const contentType = res.headers.get('content-type') || 'image/png';
            const buffer = await res.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            $img.attr('src', `data:${contentType};base64,${base64}`);
            
            // If it's a GIF, we don't need to do anything special as base64 data URL 
            // with correct content-type will preserve animation.
          })
          .catch(err => {
            console.error(`Failed to proxy image ${absoluteSrc}:`, err);
            // Fallback to absolute URL if proxy fails
            $img.attr('src', absoluteSrc);
          });
        
        imgPromises.push(promise);
      }
      
      // Ensure images are responsive and visible
      $img.addClass('max-w-full h-auto rounded-2xl my-8 block mx-auto shadow-lg');
      $img.removeAttr('width');
      $img.removeAttr('height');
    });

    // Wait for all images to be base64 encoded
    await Promise.all(imgPromises);

    // 4. Map Google Docs Styles to proper HTML tags
    // Google Docs often uses classes like .title, .subtitle or specific heading tags
    // We want to ensure hierarchy is respected.
    $content('.title').each((_, el) => {
      const text = $content(el).text();
      $content(el).replaceWith(`<h1 class="text-5xl md:text-7xl font-bold mb-8">${text}</h1>`);
    });
    
    $content('.subtitle').each((_, el) => {
      const text = $content(el).text();
      $content(el).replaceWith(`<h2 class="text-3xl md:text-4xl font-medium mb-6 opacity-70">${text}</h2>`);
    });

    // 5. Basic Sanitization (Allowlist approach)
    const allowedTags = ['h1', 'h2', 'h3', 'h4', 'p', 'ul', 'ol', 'li', 'a', 'img', 'strong', 'em', 'blockquote', 'code', 'pre', 'br', 'hr', 'div', 'iframe', 'span', 'table', 'thead', 'tbody', 'tr', 'td', 'th'];
    
    $content('*').each((_, el) => {
      if (el.type === 'tag' && !allowedTags.includes(el.name)) {
        const children = $content(el).html();
        $content(el).replaceWith(children || '');
      }
    });

    // 6. Clean up attributes
    // We allow 'style' on images specifically if they have inline dimensions from Google
    const allowedAttrs = ['href', 'src', 'alt', 'target', 'rel', 'class', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'referrerpolicy', 'style'];
    $content('*').each((_, el) => {
      if (el.type === 'tag') {
        const attrs = el.attribs;
        for (const attr in attrs) {
          if (!allowedAttrs.includes(attr)) {
            $content(el).removeAttr(attr);
          }
        }
      }
    });

    return $content.html();
  } catch (error) {
    console.error("Error fetching Google Doc:", error);
    return null;
  }
}

function injectMetaTags(html: string, data: { title: string, description: string, image?: string }) {
  const $ = cheerio.load(html);
  
  // Remove existing meta tags that we want to replace
  $('title').remove();
  $('meta[name="description"]').remove();
  $('meta[property^="og:"]').remove();
  
  // Add new meta tags
  $('head').prepend(`
    <title>${escapeHtml(data.title)} | Beluga Blog</title>
    <meta name="description" content="${escapeHtml(data.description)}">
    <meta property="og:title" content="${escapeHtml(data.title)}">
    <meta property="og:description" content="${escapeHtml(data.description)}">
    ${data.image ? `<meta property="og:image" content="${escapeHtml(data.image)}">` : ''}
    <meta property="og:type" content="article">
  `);
  
  return $.html();
}

async function getBlogPost(slug: string) {
  const cacheKey = `blog-${slug}`;

  // Check cache in production
  if (process.env.NODE_ENV === "production") {
    const cached = cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return cached.data;
    }
  }

  try {
    // Fetch from Builder.io
    const entry = await builder.get('blog', {
      query: {
        'data.slug': slug
      }
    }).toPromise();

    if (!entry) return null;

    let contentHtml = entry.data.content || "";
    
    // If docId exists, fetch from Google Docs
    if (entry.data.docId) {
      let googleDocUrl = entry.data.docId;
      if (!googleDocUrl.startsWith('http')) {
        googleDocUrl = `https://docs.google.com/document/d/e/${entry.data.docId}/pub`;
      }
      
      const googleDocHtml = await fetchAndSanitizeGoogleDoc(googleDocUrl);
      if (googleDocHtml) {
        contentHtml = googleDocHtml;
      }
    }

    const responseData = {
      title: entry.data.title,
      description: entry.data.description || entry.data.excerpt,
      content: contentHtml,
      author: entry.data.author,
      date: entry.data.date,
      image: entry.data.image
    };

    // Store in cache
    if (process.env.NODE_ENV === "production") {
      cache.set(cacheKey, { data: responseData, timestamp: Date.now() });
    }

    return responseData;
  } catch (error) {
    console.error("Error fetching blog post:", error);
    return null;
  }
}

async function renderAppHtml(url: string, req: express.Request) {
  let template = '';
  if (process.env.NODE_ENV !== 'production') {
    const rawTemplate = fs.readFileSync(path.resolve('.', 'index.html'), 'utf-8');
    template = await req.app.locals.vite.transformIndexHtml(url, rawTemplate);
  } else {
    template = fs.readFileSync(path.resolve('.', 'dist/index.html'), 'utf-8');
  }

  return injectGlobalThemeCss(template);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  let vite: any;
  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.locals.vite = vite;
  }

  // Trust proxy for correct protocol/host detection behind nginx
  app.set('trust proxy', true);

  // Helper to get the public base URL
  const getBaseUrl = () => {
    // Always use the requested production domain for SEO files
    return 'https://www.ojetillopeludo.site';
  };

  // API: Blog Post Data
  app.get("/api/blog/:slug", async (req, res) => {
    const { slug } = req.params;
    const post = await getBlogPost(slug);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json(post);
  });

  // API: current global theme data for debugging or future client use
  app.get('/api/theme', async (_req, res) => {
    try {
      const theme = await getGlobalThemeEntry();
      res.json({ 
        success: !!theme,
        themeId: GLOBAL_THEME_ENTRY_ID,
        model: GLOBAL_THEME_MODEL,
        data: theme,
        error: theme ? null : "No data returned from Builder.io. Check model name and entry ID."
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });

  // Dynamic Global CSS route
  app.get('/globals.css', async (_req, res) => {
    try {
      console.log('Serving dynamic globals.css');
      const themeData = await getGlobalThemeEntry();
      const themeCss = buildGlobalThemeCss(themeData);
      res.type('text/css').send(themeCss);
    } catch (error) {
      console.error('Error serving globals.css:', error);
      res.status(500).send('/* Error loading theme */');
    }
  });

  // Silence Service Worker MIME type errors by serving a dummy JS file
  app.get("*/_service-worker.js", (req, res) => {
    res.type("application/javascript");
    res.send("// Dummy Service Worker to silence MIME type errors");
  });

  // Robots.txt
  app.get("/robots.txt", (req, res) => {
    const baseUrl = getBaseUrl();
    const robots = `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml`;
    res.type("text/plain");
    res.send(robots);
  });

  // Sitemap Index
  app.get("/sitemap.xml", (req, res) => {
    const baseUrl = getBaseUrl();
    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap-pages.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap-posts.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>
</sitemapindex>`;

    res.type("application/xml");
    res.send(sitemapIndex);
  });

  // Pages Sitemap
  app.get("/sitemap-pages.xml", async (req, res) => {
    try {
      const pages = await builder.getAll('page', {
        options: { 
          noTargeting: true,
          includeRefs: false
        },
      });

      const baseUrl = getBaseUrl();
      const staticRoutes = ['/'];
      
      const builderPagePaths = pages
        .map((page: any) => page.data?.url || page.query?.urlPath || page.data?.urlPath || page.url)
        .filter(Boolean)
        .map((pagePath: string) => pagePath.startsWith('/') ? pagePath : `/${pagePath}`);

      const allPaths = Array.from(new Set([...staticRoutes, ...builderPagePaths]));

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allPaths.map(currentPath => `
  <url>
    <loc>${baseUrl}${currentPath}</loc>
    <changefreq>weekly</changefreq>
    <priority>${currentPath === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('')}
</urlset>`;

      res.type("application/xml");
      res.send(sitemap);
    } catch (error) {
      console.error("Error generating pages sitemap:", error);
      res.status(500).send("Error generating pages sitemap");
    }
  });

  // Posts Sitemap
  app.get("/sitemap-posts.xml", async (req, res) => {
    try {
      const blogPosts = await builder.getAll('blog', {
        options: {
          noTargeting: true,
          includeRefs: false
        }
      });

      const baseUrl = getBaseUrl();
      
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${blogPosts.map((post: any) => {
    const slug = post.data?.slug;
    if (!slug) return '';
    const lastMod = post.lastUpdated ? new Date(post.lastUpdated).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    return `
  <url>
    <loc>${baseUrl}/blog/${slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
  }).join('')}
</urlset>`;

      res.type("application/xml");
      res.send(sitemap);
    } catch (error) {
      console.error("Error generating posts sitemap:", error);
      res.status(500).send("Error generating posts sitemap");
    }
  });

  // Blog Post HTML with SEO injection
  app.get("/blog/:slug", async (req, res, next) => {
    const { slug } = req.params;
    const post = await getBlogPost(slug);
    
    if (!post) {
      return next(); // Let SPA handle 404
    }

    try {
      let html = await renderAppHtml(req.originalUrl, req);
      html = injectMetaTags(html, {
        title: post.title,
        description: post.description,
        image: post.image
      });

      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      console.error("Error injecting SEO tags:", e);
      next();
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && vite) {
    app.use(vite.middlewares);
  } else {
    // Production static serving - disable index.html serving to allow our custom handler to inject the theme
    app.use(express.static("dist", { index: false }));
  }

  app.get('*', async (req, res, next) => {
    try {
      const html = await renderAppHtml(req.originalUrl, req);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (error) {
      console.error('Error rendering app HTML:', error);
      next(error);
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
