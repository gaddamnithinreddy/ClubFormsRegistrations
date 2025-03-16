import { NextApiRequest, NextApiResponse } from 'next';
import { generateSitemap } from '../../src/lib/utils/sitemap';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://clubformsregistrations.vercel.app';
    const sitemap = await generateSitemap(baseUrl);

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');
    res.write(sitemap);
    res.end();
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({ message: 'Error generating sitemap' });
  }
} 