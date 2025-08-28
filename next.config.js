/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // Enable static exports
  distDir: 'out', // Output directory for static files
  images: {
    unoptimized: true, // Required for static export
  },
  basePath: process.env.NODE_ENV === 'production' ? '/QuizManagementSystem' : '', // Set base path for GitHub Pages
  assetPrefix: process.env.NODE_ENV === 'production' ? '/QuizManagementSystem/' : '', // Set asset prefix for GitHub Pages
  trailingSlash: true, // Add trailing slashes to all routes
  // Headers are not applied during static export, but kept for local development
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net https://*.firebase.app;"
          }
        ]
      }
    ];
  },
  // This ensures that Next.js correctly exports static HTML files for GitHub Pages
  exportPathMap: async function () {
    return {
      '/': { page: '/' },
      '/404': { page: '/404' }
    };
  }
};

module.exports = nextConfig;
