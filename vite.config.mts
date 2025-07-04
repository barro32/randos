import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    root: resolve(__dirname, 'src'),
    build: {
      outDir: resolve(__dirname, 'dist'),
      emptyOutDir: true,
      sourcemap: true,
      rollupOptions: {
        output: {
          entryFileNames: isProduction ? '[name].[hash].js' : '[name].js',
          chunkFileNames: isProduction ? '[name].[hash].js' : '[name].js',
          assetFileNames: isProduction ? '[name].[hash].[ext]' : '[name].[ext]'
        }
      }
    },
    server: {
      port: 8080,
      open: true
    },
    base: isProduction ? '/randos/' : './'
  };
});