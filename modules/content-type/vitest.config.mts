import { defineConfig } from 'vitest/config'
import rootConfig from '../../vitest.config.mjs'

export default defineConfig({
    ...rootConfig,
    test: {
        ...rootConfig.test,
        coverage: {
            ...rootConfig.test?.coverage,
            exclude: [
                ...(rootConfig.test?.coverage as any)?.exclude ?? [],
                'src/types.ts',
                'src/index.ts',
            ],
        },
    },
})
