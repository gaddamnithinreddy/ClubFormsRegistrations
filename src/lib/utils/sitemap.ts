import { supabase } from '../supabase';

interface SitemapURL {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export async function generateSitemap(baseUrl: string): Promise<string> {
  const urls: SitemapURL[] = [
    {
      loc: baseUrl,
      changefreq: 'daily',
      priority: 1.0
    }
  ];

  try {
    // Get all public forms
    const { data: forms, error } = await supabase
      .from('forms')
      .select('id, updated_at')
      .eq('accepting_responses', true);

    if (error) throw error;

    // Add form URLs to sitemap
    forms?.forEach(form => {
      urls.push({
        loc: `${baseUrl}/form/${form.id}`,
        lastmod: form.updated_at,
        changefreq: 'daily',
        priority: 0.8
      });
    });

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;

    return xml;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    throw error;
  }
} 