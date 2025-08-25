import { defineConfig } from 'vitest/config'
import swc from 'unplugin-swc'

export default defineConfig({
    plugins: [
        swc.vite({
            jsc: {
                parser: { syntax: 'typescript', decorators: true },
                transform: {
                    legacyDecorator: true,
                    decoratorMetadata: true, // 这行会生成 design:type / design:paramtypes
                },
            },
        }),
    ],
    test: {
        environment: 'node',
        // Use 'v8' as the coverage provider
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
