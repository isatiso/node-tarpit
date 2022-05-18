/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { RollupConfig } from "@tarpit/abraham"

export const config = new RollupConfig({
    dts_glob: ['src/**/*.d.ts', '!__dts/**/*.d.ts', '!lib/**/*.d.ts'],
    externals: ['typescript'],
    inputOptions: { cache: false }
})

export default config.create('./src/index.ts', true)
