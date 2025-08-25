import { defineConfig } from 'vitest/config'
import rootConfig from '../../vitest.config.mjs'

export default defineConfig({
    ...rootConfig,
    test: {
        ...rootConfig.test,
        globalSetup: './tests/helpers/global-setup.ts',
        coverage: {
            ...rootConfig.test?.coverage,
            exclude: [
                ...(rootConfig.test?.coverage as any)?.exclude ?? [],
                'tests/*',
            ],
        },
    }
})
