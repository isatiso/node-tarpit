import { defineConfig } from 'vitest/config'
import swc from 'unplugin-swc'

export default defineConfig({
    plugins: [
        swc.vite({
            jsc: {
                parser: { syntax: 'typescript', decorators: true },
                transform: {
                    legacyDecorator: true,
                    decoratorMetadata: true,
                },
            },
        }),
    ],
    test: {
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'vitest.config.mts',
                'lib/**',
            ]
        },
    },
})
