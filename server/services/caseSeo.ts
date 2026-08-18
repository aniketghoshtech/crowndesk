import { CaseRecord } from '../models/types';

export interface CaseSeoData {
  caseId: string;
  title: string;
  description: string;
  keywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
  ogImage: string;
  ogType: string;
  ogSiteName: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  jsonLd: Record<string, any>;
  rawMetaTagsHtml: string;
}

/**
 * Clean human-readable status label from enum
 */
export function formatCaseStatus(status: string): string {
  switch (status) {
    case 'NEW':
      return 'New Submission';
    case 'RECEIVED':
      return 'Received & In QC';
    case 'ASSIGNED':
      return 'Assigned to Certified CAD Designer';
    case 'IN_DESIGN':
      return 'In Active 3D CAD Design';
    case 'QC':
      return 'Under Strict Quality Control';
    case 'APPROVAL':
      return 'Pending Doctor Approval';
    case 'REVISION':
      return 'Revision In Progress';
    case 'COMPLETED':
      return 'Design Completed & Ready';
    case 'DELIVERED':
      return 'Delivered & Milling STL Unlocked';
    default:
      return status.replace(/_/g, ' ');
  }
}

/**
 * Generate high-performance SEO & Social meta tags and Schema.org JSON-LD for a single Dental CAD case
 */
export function generateCaseSeoMetadata(caseRecord: CaseRecord, reqHost?: string): CaseSeoData {
  const protocol = reqHost && reqHost.includes('localhost') ? 'http' : 'https';
  const host = reqHost || 'crowndesk.com';
  const baseUrl = `${protocol}://${host}`;

  const cleanCaseId = caseRecord.id.trim().toUpperCase();
  const serviceName = caseRecord.serviceName || 'Dental CAD Restoration';
  const units = caseRecord.unitsQuantity || 1;
  const unitLabel = units === 1 ? '1 Unit' : `${units} Units`;
  const material = caseRecord.material || 'Anatomic Zirconia / High-grade Resin';
  const statusLabel = formatCaseStatus(caseRecord.status);
  const shade = caseRecord.shade ? ` [Shade: ${caseRecord.shade}]` : '';

  const title = `Case ${cleanCaseId} — ${serviceName} (${unitLabel}) | CrownDesk Dental CAD`;
  const description = `Live CAD Tracking for Case ${cleanCaseId}: ${serviceName} (${unitLabel}${shade}), Material: ${material}. Status: ${statusLabel}. Turnaround: Standard 12-24h. Verified precision dental workflow by CrownDesk.`;
  const keywords = `Dental CAD Case ${cleanCaseId}, ${serviceName}, ${material}, Dental Lab CAD Design, Tooth Restoration STL, 3D Dental CAD, CrownDesk Case Tracker`;
  
  const canonicalUrl = `${baseUrl}/cases?searchId=${encodeURIComponent(cleanCaseId)}`;
  const ogTitle = `Dental CAD Case ${cleanCaseId} | ${serviceName}`;
  const ogDescription = `Track live design status for Case ${cleanCaseId} (${unitLabel} ${serviceName}). Status: ${statusLabel}. Precision Dental CAD by CrownDesk.`;
  const ogUrl = canonicalUrl;
  const ogImage = `${baseUrl}/favicon.svg`;
  const ogType = 'article';
  const ogSiteName = 'CrownDesk Dental CAD SaaS Platform';

  const twitterCard = 'summary_large_image';
  const twitterTitle = `Case ${cleanCaseId} — ${serviceName} | CrownDesk CAD`;
  const twitterDescription = `Live status: ${statusLabel} (${unitLabel}). Precision anatomic dental design with milling-ready STL exports.`;
  const twitterImage = `${baseUrl}/favicon.svg`;

  // Schema.org MedicalProcedure & Service Structured Data for Dental CAD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalProcedure',
    name: `Dental CAD Design — Case ${cleanCaseId}`,
    code: {
      '@type': 'MedicalCode',
      code: cleanCaseId,
      codingSystem: 'CrownDesk-Case-ID',
    },
    procedureType: 'Dental Prosthetic CAD Design',
    bodyLocation: 'Oral Cavity / Dentition',
    description: `High-precision custom dental CAD design for ${serviceName} (${unitLabel}). Material specification: ${material}.`,
    provider: {
      '@type': 'Organization',
      name: 'CrownDesk Dental CAD Platform',
      url: baseUrl,
      logo: `${baseUrl}/favicon.svg`,
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+91-9058322251',
        contactType: 'customer support',
        areaServed: 'Worldwide',
        availableLanguage: ['English', 'Hindi'],
      },
    },
    status: statusLabel,
    dateCreated: caseRecord.createdAt,
    dateModified: caseRecord.updatedAt || caseRecord.createdAt,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
  };

  const rawMetaTagsHtml = `
    <!-- Primary Case Dynamic SEO Meta Tags -->
    <title>${escapeHtml(title)}</title>
    <meta name="title" content="${escapeHtml(title)}" />
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="keywords" content="${escapeHtml(keywords)}" />
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />

    <!-- Open Graph / Facebook / LinkedIn / WhatsApp -->
    <meta property="og:type" content="${escapeHtml(ogType)}" />
    <meta property="og:site_name" content="${escapeHtml(ogSiteName)}" />
    <meta property="og:url" content="${escapeHtml(ogUrl)}" />
    <meta property="og:title" content="${escapeHtml(ogTitle)}" />
    <meta property="og:description" content="${escapeHtml(ogDescription)}" />
    <meta property="og:image" content="${escapeHtml(ogImage)}" />
    <meta property="og:image:alt" content="CrownDesk Precision Dental CAD Case ${escapeHtml(cleanCaseId)}" />

    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="${escapeHtml(twitterCard)}" />
    <meta name="twitter:site" content="@CrownDeskCAD" />
    <meta name="twitter:url" content="${escapeHtml(ogUrl)}" />
    <meta name="twitter:title" content="${escapeHtml(twitterTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(twitterDescription)}" />
    <meta name="twitter:image" content="${escapeHtml(twitterImage)}" />

    <!-- Case Specific Technical Meta Tags -->
    <meta name="dental:case_id" content="${escapeHtml(cleanCaseId)}" />
    <meta name="dental:service_name" content="${escapeHtml(serviceName)}" />
    <meta name="dental:units_count" content="${units}" />
    <meta name="dental:status" content="${escapeHtml(caseRecord.status)}" />
    <meta name="dental:material" content="${escapeHtml(material)}" />

    <!-- Schema.org JSON-LD Structured Data -->
    <script type="application/ld+json" id="case-seo-schema">
${JSON.stringify(jsonLd, null, 2)}
    </script>
  `;

  return {
    caseId: cleanCaseId,
    title,
    description,
    keywords,
    canonicalUrl,
    ogTitle,
    ogDescription,
    ogUrl,
    ogImage,
    ogType,
    ogSiteName,
    twitterCard,
    twitterTitle,
    twitterDescription,
    twitterImage,
    jsonLd,
    rawMetaTagsHtml,
  };
}

/**
 * Injects dynamic case SEO meta tags into standard HTML document template
 */
export function injectCaseSeoIntoHtml(html: string, caseRecord: CaseRecord, reqHost?: string): string {
  const seoData = generateCaseSeoMetadata(caseRecord, reqHost);

  // Remove existing static title, description, and og tags in <head> to prevent duplicates
  let modifiedHtml = html
    .replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\s+name=["']description["'][\s\S]*?>/gi, '')
    .replace(/<meta\s+property=["']og:[\s\S]*?>/gi, '')
    .replace(/<meta\s+name=["']twitter:[\s\S]*?>/gi, '')
    .replace(/<link\s+rel=["']canonical["'][\s\S]*?>/gi, '');

  // Inject dynamic meta tags directly right after <head>
  if (modifiedHtml.includes('<head>')) {
    return modifiedHtml.replace('<head>', `<head>\n${seoData.rawMetaTagsHtml}`);
  }

  // Fallback if <head> tag is formatted differently
  return seoData.rawMetaTagsHtml + modifiedHtml;
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
