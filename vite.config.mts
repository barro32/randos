import { defineConfig } from 'vite'; // Changed import
import { resolve } from 'path';
import type { UserConfig as VitestUserConfigInterface } from 'vitest/config'; // For typing

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  const vitestConfig: VitestUserConfigInterface['test'] = { // Explicitly typed
    globals: true,
    environment: 'jsdom',
    root: resolve(__dirname), // Set Vitest root to project directory
    include: ['./src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,jsx,tsx}'], // Reverted to original specific pattern
    reporters: ['default', 'html'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
    },
  };

  return {
    root: resolve(__dirname, 'src'), // Vite's root for dev/build
    test: vitestConfig, // Assign the Vitest config
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