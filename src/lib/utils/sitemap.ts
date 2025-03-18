import { supabase } from '../supabase';

export async function generateSitemap(): Promise<string> {
  const baseUrl = 'https://formflow.app';
  const now = new Date().toISOString();

  // Static routes
  const staticRoutes = [
    '',
    '/login',
    '/register',
    '/dashboard',
    '/forms/new',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastmod: now,
    changefreq: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? '1.0' : '0.8'
  }));

  // Dynamic form routes
  let formRoutes: any[] = [];
  try {
    const { data: forms } = await supabase
      .from('forms')
      .select('id, updated_at')
      .eq('is_public', true);

    if (forms) {
      formRoutes = forms.map(form => ({
        url: `${baseUrl}/forms/${form.id}`,
        lastmod: form.updated_at,
        changefreq: 'weekly',
        priority: '0.6'
      }));
    }
  } catch (error) {
    console.error('Error fetching forms for sitemap:', error);
  }

  // Combine all routes
  const allRoutes = [...staticRoutes, ...formRoutes];

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allRoutes.map(route => `
  <url>
    <loc>${route.url}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>
  `).join('')}
</urlset>`;

  return xml;
} 