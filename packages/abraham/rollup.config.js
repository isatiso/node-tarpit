// noinspection JSFileReferences
const r = require('./out')

export default new r.RollupConfig({ outDir: './lib' }).create('./src/index.ts', true)
