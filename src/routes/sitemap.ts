import { generateSitemap } from '../lib/utils/sitemap';

export async function handleSitemapRequest(): Promise<{ xml: string }> {
  try {
    const sitemap = await generateSitemap();
    return { xml: sitemap };
  } catch (error) {
    console.error('Error generating sitemap:', error);
    throw error;
  }
} 