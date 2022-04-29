import { RollupConfig } from "@tarpit/abraham"

export const config = new RollupConfig({
    dts_glob: ['src/**/*.d.ts', '!__dts/**/*.d.ts', '!lib/**/*.d.ts'],
    externals: ['typescript'],
    inputOptions: { cache: false }
})

export default config.create('./src/index.ts', true)
