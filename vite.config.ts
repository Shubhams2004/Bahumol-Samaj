import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({ mode }) => {
  // Configured specifically for repository: Shubhams2004/Bahumol-Samaj
  // Target URL: https://shubhams2004.github.io/Bahumol-Samaj/
  // In development, '/' serves cleanly on port 3000;
  // In production build, base defaults to '/Bahumol-Samaj/' (or GITHUB_REPOSITORY / VITE_BASE_PATH if provided).
  const repoName = process.env.GITHUB_REPOSITORY
    ? process.env.GITHUB_REPOSITORY.split('/')[1]
    : 'Bahumol-Samaj';
  const defaultProductionBase = `/${repoName}/`;

  const base =
    process.env.VITE_BASE_PATH ||
    (mode === 'development' ? '/' : defaultProductionBase);

  return {
    base,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
