const r= require('./lib')

export default new r.RollupConfig({}).create('./src/index.ts', true)
