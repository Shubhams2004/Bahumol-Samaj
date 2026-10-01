import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  // Determine base path for GitHub Pages deployment:
  // 1. Explicit override via VITE_BASE_PATH (e.g. "/bahumol-samaj/")
  // 2. In GitHub Actions, automatically detect from GITHUB_REPOSITORY ("<owner>/<repo>")
  // 3. Fallback to relative path './' which safely resolves assets on any domain, subfolder, or preview URL
  let base = './';
  if (process.env.VITE_BASE_PATH) {
    base = process.env.VITE_BASE_PATH;
  } else if (process.env.GITHUB_REPOSITORY) {
    const repoName = process.env.GITHUB_REPOSITORY.split('/')[1];
    base = `/${repoName}/`;
  }

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
