import { configDefaults, defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    coverage: {
      all: true,
      include: ['src'],
      exclude: [...(configDefaults.coverage.exclude ?? []), 'src/types'],
    },
  },
});
