/** @type {import('next').NextConfig} */

// When STATIC_EXPORT=true (e.g. for GitHub Pages build), the app is
// exported as fully static HTML/CSS/JS. In that mode we also set a
// basePath because GitHub Pages serves the site under /<repo-name>/.
const isStaticExport = process.env.STATIC_EXPORT === 'true';
const repoName = process.env.GITHUB_REPO_NAME || 'Beauty_shop';

const nextConfig = {
  ...(isStaticExport && {
    output: 'export',
    basePath: `/${repoName}`,
    assetPrefix: `/${repoName}/`,
    trailingSlash: true,
  }),
  images: {
    // GitHub Pages cannot run the Next image optimizer, so disable it
    // when exporting statically.
    unoptimized: isStaticExport,
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.beautyshop.es' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
};

module.exports = nextConfig;
