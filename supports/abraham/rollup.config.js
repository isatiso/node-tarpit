/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

// noinspection JSFileReferences
const r = require('./out')

export default new r.RollupConfig({ outDir: './lib' }).create('./src/index.ts', true)
