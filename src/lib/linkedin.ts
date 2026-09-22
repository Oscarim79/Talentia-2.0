// ============================================================
//  Exportación de vacantes al formato XML de LinkedIn Job Postings.
//  Sigue el esquema de feed de LinkedIn (<source><job>…</job></source>)
//  para publicar plazas vía partner feed. Demo: se descarga el archivo.
// ============================================================
import type { Job, Tenant } from '../types';

const JOBTYPE: Record<Job['employmentType'], string> = {
  'Full-time': 'FULL_TIME',
  'Part-time': 'PART_TIME',
  Contract: 'CONTRACT',
};

/** Encierra texto en CDATA de forma segura (corta secuencias `]]>`). */
function cdata(text: string): string {
  return `<![CDATA[${String(text).replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

/** Convierte el markdown ligero del LLM a HTML mínimo para la descripción. */
function descriptionToHtml(md: string): string {
  return md
    .split('\n')
    .map((line) => {
      const t = line.trim();
      if (!t) return '';
      if (t.startsWith('## ')) return `<h2>${t.slice(3)}</h2>`;
      if (t.startsWith('**') && t.endsWith('**')) return `<h3>${t.replace(/\*\*/g, '')}</h3>`;
      if (t.startsWith('- ')) return `<li>${t.slice(2)}</li>`;
      return `<p>${t}</p>`;
    })
    .filter(Boolean)
    .join('\n')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>\n${m}</ul>\n`);
}

/** Genera el XML de una vacante para el feed de LinkedIn. */
export function jobToLinkedInXml(job: Job, tenant: Tenant): string {
  const now = new Date().toUTCString();
  const html = descriptionToHtml(job.description);
  const applyUrl = `https://talentia.app/${job.applySlug}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<source>
  <lastBuildDate>${now}</lastBuildDate>
  <publisher>Talentia 2.0</publisher>
  <publisherUrl>https://talentia.app</publisherUrl>
  <job>
    <partnerJobId>${cdata(job.id)}</partnerJobId>
    <company>${cdata(job.brand || tenant.name)}</company>
    <title>${cdata(job.title)}</title>
    <description>${cdata(html)}</description>
    <applyUrl>${cdata(applyUrl)}</applyUrl>
    <location>${cdata(job.location)}</location>
    <country>GT</country>
    <jobtype>${JOBTYPE[job.employmentType]}</jobtype>
    <alternateTitle>${cdata(job.department)}</alternateTitle>
    <salaries>
      <salary>
        <type>BASE_SALARY</type>
        <highEnd><amount>${job.salaryMax}</amount><currencyCode>GTQ</currencyCode></highEnd>
        <lowEnd><amount>${job.salaryMin}</amount><currencyCode>GTQ</currencyCode></lowEnd>
        <period>MONTHLY</period>
      </salary>
    </salaries>
    <openings>${job.openings}</openings>
  </job>
</source>
`;
}
