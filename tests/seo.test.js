/**
 * SEO & HTML Validation Tests
 * Software Manifesto Landing Page
 * 
 * Run with: npx playwright test  OR  node --test tests/seo.test.js
 * 
 * Tool: Playwright (install: npm install -D playwright @playwright/test)
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// ============================================================
// UNIT TESTS — Parse index.html directly (no server needed)
// ============================================================

test.describe('HTML Structure & SEO Meta Tags', () => {
  let html;

  test.beforeAll(() => {
    html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf-8');
  });

  test('TC-001: HTML has lang="en" attribute', () => {
    expect(html).toMatch(/<html[^>]+lang="en"/);
  });

  test('TC-002: Title tag is present and keyword-rich', () => {
    const match = html.match(/<title>([^<]+)<\/title>/);
    expect(match).not.toBeNull();
    const title = match[1];
    expect(title.toLowerCase()).toContain('software manifesto');
    expect(title.length).toBeGreaterThanOrEqual(40);
    expect(title.length).toBeLessThanOrEqual(70);
  });

  test('TC-003: Meta description is present and within length bounds', () => {
    const match = html.match(/<meta\s+name="description"\s+content="([^"]+)"/);
    expect(match).not.toBeNull();
    const desc = match[1];
    expect(desc.length).toBeGreaterThanOrEqual(120);
    expect(desc.length).toBeLessThanOrEqual(165);
  });

  test('TC-004: Canonical URL tag is present', () => {
    expect(html).toMatch(/<link\s+rel="canonical"\s+href="https?:\/\/[^"]+"/);
  });

  test('TC-005: Open Graph - og:title present', () => {
    expect(html).toMatch(/property="og:title"/);
  });

  test('TC-006: Open Graph - og:description present', () => {
    expect(html).toMatch(/property="og:description"/);
  });

  test('TC-007: Open Graph - og:image present', () => {
    expect(html).toMatch(/property="og:image"/);
  });

  test('TC-008: Open Graph - og:url present', () => {
    expect(html).toMatch(/property="og:url"/);
  });

  test('TC-009: Open Graph - og:type present', () => {
    expect(html).toMatch(/property="og:type"/);
  });

  test('TC-010: Twitter Card - twitter:card present', () => {
    expect(html).toMatch(/name="twitter:card"/);
  });

  test('TC-011: Twitter Card - twitter:title present', () => {
    expect(html).toMatch(/name="twitter:title"/);
  });

  test('TC-012: JSON-LD schema present', () => {
    expect(html).toMatch(/application\/ld\+json/);
    expect(html).toMatch(/"@type":\s*"WebPage"/);
  });

  test('TC-013: JSON-LD is valid JSON', () => {
    const match = html.match(/<script type="application\/ld\+json">([\s\S]+?)<\/script>/);
    expect(match).not.toBeNull();
    expect(() => JSON.parse(match[1])).not.toThrow();
  });

  test('TC-014: robots meta allows indexing', () => {
    expect(html).toMatch(/name="robots"\s+content="index,\s*follow"/);
  });

  test('TC-015: Viewport meta tag is present', () => {
    expect(html).toMatch(/name="viewport"/);
  });

  test('TC-016: H1 contains "Software Manifesto"', () => {
    expect(html).toMatch(/<h1[^>]*>[\s\S]*?Software Manifesto[\s\S]*?<\/h1>/i);
  });

  test('TC-017: Exactly one H1 tag on page', () => {
    const matches = html.match(/<h1[\s>]/g);
    expect(matches).not.toBeNull();
    expect(matches.length).toBe(1);
  });

  test('TC-018: At least 8 H3 tags (principles)', () => {
    const matches = html.match(/<h3[\s>]/g);
    expect(matches).not.toBeNull();
    expect(matches.length).toBeGreaterThanOrEqual(8);
  });

  test('TC-019: No broken external links (no bare http://)', () => {
    // All external links should be https
    const httpLinks = html.match(/href="http:\/\//g);
    expect(httpLinks).toBeNull();
  });

  test('TC-020: No render-blocking scripts in <head>', () => {
    const headMatch = html.match(/<head>([\s\S]+?)<\/head>/);
    expect(headMatch).not.toBeNull();
    const head = headMatch[1];
    // Should not contain <script src= without defer/async
    const blockingScript = head.match(/<script\s+src="[^"]+"\s*>/);
    expect(blockingScript).toBeNull();
  });

  test('TC-021: Footer exists with copyright', () => {
    expect(html).toMatch(/<footer[\s>]/);
    expect(html).toMatch(/&copy;|©/);
  });

  test('TC-022: robots.txt exists', () => {
    expect(fs.existsSync(path.join(__dirname, '../robots.txt'))).toBe(true);
  });

  test('TC-023: sitemap.xml exists', () => {
    expect(fs.existsSync(path.join(__dirname, '../sitemap.xml'))).toBe(true);
  });

  test('TC-024: sitemap.xml contains valid URL', () => {
    const sitemap = fs.readFileSync(path.join(__dirname, '../sitemap.xml'), 'utf-8');
    expect(sitemap).toMatch(/<loc>https?:\/\//);
    expect(sitemap).toMatch(/<changefreq>/);
    expect(sitemap).toMatch(/<priority>1\.0<\/priority>/);
  });

  test('TC-025: robots.txt allows all and references sitemap', () => {
    const robots = fs.readFileSync(path.join(__dirname, '../robots.txt'), 'utf-8');
    expect(robots).toMatch(/User-agent: \*/);
    expect(robots).toMatch(/Allow: \//);
    expect(robots).toMatch(/Sitemap:/);
  });
});

// ============================================================
// E2E TESTS — Requires a running server (npx serve .)
// ============================================================

test.describe('E2E: Page Load & Rendering', () => {
  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

  test('TC-030: Page loads with 200 status', async ({ page }) => {
    const response = await page.goto(BASE_URL);
    expect(response.status()).toBe(200);
  });

  test('TC-031: H1 is visible on page', async ({ page }) => {
    await page.goto(BASE_URL);
    const h1 = await page.locator('h1');
    await expect(h1).toBeVisible();
    const text = await h1.innerText();
    expect(text.toLowerCase()).toContain('software manifesto');
  });

  test('TC-032: All 10 principles are visible', async ({ page }) => {
    await page.goto(BASE_URL);
    const principles = await page.locator('.principle').count();
    expect(principles).toBe(10);
  });

  test('TC-033: Page has no console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto(BASE_URL);
    expect(errors.length).toBe(0);
  });

  test('TC-034: Mobile viewport - content is readable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE_URL);
    const h1 = await page.locator('h1');
    await expect(h1).toBeVisible();
  });

  test('TC-035: CTA button/link is visible', async ({ page }) => {
    await page.goto(BASE_URL);
    const cta = await page.locator('.btn');
    await expect(cta).toBeVisible();
  });

  test('TC-036: 404 page loads for unknown routes', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/nonexistent-page`);
    expect(response.status()).toBe(404);
  });
});
