import { Request, Response } from 'express';
import { db } from '../db/store';
import { injectCaseSeoIntoHtml } from '../services/caseSeo';

/**
 * Extracts a Case ID from URL path or query parameters
 */
export function extractCaseIdFromRequest(req: Request): string | null {
  // 1. Check path parameters like /cases/CD-2026-00001 or /case/CD-2026-00001
  const pathMatch = req.path.match(/^\/(?:cases|case)\/([a-zA-Z0-9_-]+)/i);
  if (pathMatch && pathMatch[1]) {
    const param = pathMatch[1].trim();
    // Exclude static reserved words
    if (!['new', 'tracker', 'pricing', 'all'].includes(param.toLowerCase())) {
      return param;
    }
  }

  // 2. Check search / query parameters: ?searchId=CD-2026-00001, ?caseId=..., ?id=...
  if (req.query.searchId && typeof req.query.searchId === 'string') {
    return req.query.searchId.trim();
  }
  if (req.query.caseId && typeof req.query.caseId === 'string') {
    return req.query.caseId.trim();
  }
  if (req.query.id && typeof req.query.id === 'string' && req.query.id.toUpperCase().startsWith('CD-')) {
    return req.query.id.trim();
  }

  return null;
}

/**
 * Middleware / handler to dynamically inject case meta tags into HTML responses
 */
export async function tryServeCaseSeoHtml(
  req: Request,
  res: Response,
  getBaseHtml: () => Promise<string> | string
): Promise<boolean> {
  // Skip API routes, static asset extensions, etc.
  if (req.path.startsWith('/api/') || req.path.startsWith('/assets/') || req.path.includes('.')) {
    return false;
  }

  const caseId = extractCaseIdFromRequest(req);
  if (!caseId) {
    return false;
  }

  const caseRecord = db.findCaseById(caseId);
  if (!caseRecord) {
    return false;
  }

  try {
    const rawHtml = await getBaseHtml();
    const host = req.get('host') || undefined;
    const injectedHtml = injectCaseSeoIntoHtml(rawHtml, caseRecord, host);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(injectedHtml);
    return true;
  } catch (err) {
    console.error('Failed to inject case SEO into HTML:', err);
    return false;
  }
}
