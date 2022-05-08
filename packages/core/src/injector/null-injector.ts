/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
