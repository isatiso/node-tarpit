/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

/**
 * @private
 */
export class _NullInjector {

    readonly children: any[] = []

    has(_: any) {
        return false
    }

    get(token: any, info?: string): never {
        throw new Error(`Can't find ${token?.name ?? token} in NullInjector [${info}]`)
    }
}

/**
 * @private
 */
export const NullInjector = new _NullInjector()
