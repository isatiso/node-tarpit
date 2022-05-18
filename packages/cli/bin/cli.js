/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

#!/usr/bin/env node

const pkg = require('@tarpit/cli/package.json')
const { create_cli } = require('@tarpit/cli')

create_cli(pkg).catch(err => {
    console.log(err)
    process.exit(255)
})
