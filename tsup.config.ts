import { defineConfig } from 'tsup'

export default defineConfig({
    swc: {
        jsc: {
            transform: {
                useDefineForClassFields: false,
            },
        },
    },
})
