import { defineConfig } from 'vitest/config'
import rootConfig from '../../vitest.config.mjs'

export default defineConfig({
    ...rootConfig,
    test: {
        ...rootConfig.test,
        coverage: {
            ...rootConfig.test?.coverage,
        },
    },
})
