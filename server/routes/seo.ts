import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { db } from '../db/store';
import { getAuthenticatedUser } from './auth';
import { generateCaseSeoMetadata, injectCaseSeoIntoHtml } from '../services/caseSeo';

const router = express.Router();

// 1. GET /api/seo - Global & Page SEO Config
router.get('/', (req: Request, res: Response): void => {
  res.json({ seo: db.getSEO() });
});

// 2. GET /api/seo/case/:caseId - Dynamic SEO Metadata & Structured Data for specific Dental Case
router.get('/case/:caseId', (req: Request, res: Response): void => {
  try {
    const { caseId } = req.params;
    if (!caseId) {
      res.status(400).json({ error: 'Case ID parameter is required.' });
      return;
    }

    const caseRecord = db.findCaseById(caseId);
    if (!caseRecord) {
      res.status(404).json({ error: `Dental Case "${caseId}" not found.` });
      return;
    }

    const host = req.get('host') || undefined;
    const seoData = generateCaseSeoMetadata(caseRecord, host);

    res.json({
      success: true,
      caseId: caseRecord.id,
      seo: seoData,
    });
  } catch (err: any) {
    console.error('Error generating case SEO:', err);
    res.status(500).json({ error: err.message || 'Failed to generate case SEO' });
  }
});

// 3. GET /api/seo/render/case/:caseId - Server-Side HTML Rendering with Injected Case Meta Tags
router.get('/render/case/:caseId', (req: Request, res: Response): void => {
  try {
    const { caseId } = req.params;
    const caseRecord = db.findCaseById(caseId);
    if (!caseRecord) {
      res.status(404).send('<!DOCTYPE html><html><head><title>Case Not Found | CrownDesk</title></head><body><h1>Dental CAD Case Not Found</h1></body></html>');
      return;
    }

    // Attempt to load index.html template from dist or root
    let templateHtml = '';
    const distHtmlPath = path.join(process.cwd(), 'dist', 'index.html');
    const rootHtmlPath = path.join(process.cwd(), 'index.html');

    if (fs.existsSync(distHtmlPath)) {
      templateHtml = fs.readFileSync(distHtmlPath, 'utf-8');
    } else if (fs.existsSync(rootHtmlPath)) {
      templateHtml = fs.readFileSync(rootHtmlPath, 'utf-8');
    } else {
      templateHtml = `<!doctype html><html lang="en"><head><meta charset="UTF-8" /></head><body><div id="root"></div></body></html>`;
    }

    const host = req.get('host') || undefined;
    const injectedHtml = injectCaseSeoIntoHtml(templateHtml, caseRecord, host);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(injectedHtml);
  } catch (err: any) {
    console.error('Error rendering case SEO HTML:', err);
    res.status(500).send('Internal Server Error rendering case SEO');
  }
});

// 4. GET /api/seo/sitemap.xml - Dynamic XML Sitemap with all active cases & services
router.get('/sitemap.xml', (req: Request, res: Response): void => {
  try {
    const host = req.get('host') || 'crowndesk.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const cases = db.getAllCases();
    const services = db.getAllServices();

    interface SitemapItem {
      loc: string;
      lastmod?: string;
      changefreq: string;
      priority: string;
    }

    const staticUrls: SitemapItem[] = [
      { loc: `${baseUrl}/`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'daily', priority: '1.0' },
      { loc: `${baseUrl}/pricing`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'weekly', priority: '0.9' },
      { loc: `${baseUrl}/cases`, lastmod: new Date().toISOString().split('T')[0], changefreq: 'always', priority: '0.85' },
    ];

    const caseUrls: SitemapItem[] = cases.map((c) => ({
      loc: `${baseUrl}/cases?searchId=${encodeURIComponent(c.id)}`,
      lastmod: (c.updatedAt || c.createdAt || new Date().toISOString()).split('T')[0],
      changefreq: 'daily',
      priority: '0.8',
    }));

    const serviceUrls: SitemapItem[] = services.map((s) => ({
      loc: `${baseUrl}/pricing?service=${encodeURIComponent(s.code)}`,
      lastmod: (s.updatedAt || s.createdAt || new Date().toISOString()).split('T')[0],
      changefreq: 'weekly',
      priority: '0.7',
    }));

    const allUrls: SitemapItem[] = [...staticUrls, ...caseUrls, ...serviceUrls];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const url of allUrls) {
      xml += `  <url>\n`;
      xml += `    <loc>${url.loc}</loc>\n`;
      if (url.lastmod) xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      xml += `    <priority>${url.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate sitemap XML' });
  }
});

// 5. PUT /api/seo - Admin Update SEO
router.put('/', (req: Request, res: Response): void => {
  const user = getAuthenticatedUser(req);
  if (!user || (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
    res.status(403).json({ error: 'Administrative access required.' });
    return;
  }
  const updated = db.updateSEO(req.body);
  db.logAudit({
    userId: user.id,
    userName: user.name,
    userRole: user.role,
    action: 'SEO_UPDATED',
    details: 'SEO metadata updated from admin panel without code modification.',
    ipAddress: req.ip || '127.0.0.1',
    result: 'SUCCESS',
  });
  res.json({ message: 'SEO configuration saved.', seo: updated });
});

export default router;
