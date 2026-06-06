import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],

    resolve: {
      alias: {
        '@components': path.resolve(__dirname, 'src/components'),
        '@pages':      path.resolve(__dirname, 'src/pages'),
        '@theme':      path.resolve(__dirname, 'src/theme'),
        '@':           path.resolve(__dirname, 'src'),
        '@hooks':      path.resolve(__dirname, 'src/hooks'),
        '@contexts':   path.resolve(__dirname, 'src/contexts'),
      },
    },

    server: {
      port: 5173,
      host: true,
      allowedHosts: true,
      proxy: {

        // ── Anthropic (Claude) ───────────────────────────────────────────────
        '/api/ai/anthropic': {
          target:       'https://api.anthropic.com',
          changeOrigin: true,
          secure:       true,
          rewrite:      (path: string) => path.replace(/^\/api\/ai\/anthropic/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('x-api-key', env.VITE_AI_API_KEY ?? '');
              proxyReq.setHeader('anthropic-version', '2023-06-01');
              proxyReq.removeHeader('origin');
              // Temporary diagnostics — remove once working
              console.log('[Proxy → Anthropic] key prefix:', env.VITE_AI_API_KEY?.slice(0, 16) + '...');
            });
            proxy.on('proxyRes', (proxyRes) => {
              console.log('[Proxy ← Anthropic] status:', proxyRes.statusCode);
            });
            proxy.on('error', (err) => {
              console.error('[Proxy ✗ Anthropic] error:', err.message);
            });
          },
        },

        // ── OpenAI ──────────────────────────────────────────────────────────
        '/api/ai/openai': {
          target:       'https://api.openai.com',
          changeOrigin: true,
          secure:       true,
          rewrite:      (path: string) => path.replace(/^\/api\/ai\/openai/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('Authorization', 'Bearer ' + (env.VITE_AI_API_KEY ?? ''));
              proxyReq.removeHeader('origin');
            });
          },
        },

      },
    },

    build: {
      outDir:                'dist',
      sourcemap:             true,
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                return 'vendor-react';
              }

              if (id.includes('@tiptap')) {
                return 'vendor-tiptap';
              }

              if (id.includes('xlsx')) {
                return 'vendor-xlsx';
              }
            }

            return undefined;
          },
        },
      },
    },
  };
});
