import { defineConfig } from 'vitest/config'
import rootConfig from '../../vitest.config.mjs'

export default defineConfig({
    ...rootConfig,
    test: {
        ...rootConfig.test,
        setupFiles: ['./tests/helpers/setup-file.ts'],
        coverage: {
            ...rootConfig.test?.coverage,
            exclude: [
                ...(rootConfig.test?.coverage as any)?.exclude ?? [],
                'src/types/**',
                'src/index.ts',
            ],
        },
    },
})
