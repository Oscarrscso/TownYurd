import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 8080, // You can change the port if needed
    open: true, // Automatically open the app in the browser on server start
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true, // Generate source maps for debugging
    rollupOptions: {
        output: {
            // Ensure Phaser is bundled correctly
            manualChunks: {
                phaser: ['phaser']
            }
        }
    }
  },
  resolve: {
    alias: {
      '@/': '/src/'
    }
  },
  // Use the default root directory for index.html
  publicDir: 'public'
}); 