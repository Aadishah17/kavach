import { mergeConfig, defineConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      testTimeout: 15000,
      css: true,
      fileParallelism: false,
      include: ['tests/web/**/*.test.ts?(x)'],
      exclude: ['mobile/**', 'flutter_kavach/**'],
    },
  }),
)
