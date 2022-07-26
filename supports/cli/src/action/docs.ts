/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { deliver_shell } from '../__tools__'
import { CliOptions } from '../cli.type'
import { make_action } from './__base__'

export const action_docs = make_action('docs', async (cli_options: CliOptions['docs'], config) => {

    await deliver_shell(
        `typedoc --tsconfig tsconfig.json --out ../../docs/$(basename $(pwd)) --plugin typedoc-theme-hierarchy --theme hierarchy ./src/index.ts`
    )
})
