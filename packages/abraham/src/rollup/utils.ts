/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import builtinModules from 'builtin-modules'
import { PackageJson } from '../types'

export function gen_external(pkg: PackageJson, external?: (string | RegExp)[]) {
    return [
        ...builtinModules,
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
        ...(external ?? []),
    ]
}
