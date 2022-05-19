const { RollupConfig } = require('@tarpit/abraham')

export default new RollupConfig({}).create('./src/index.ts', true)
