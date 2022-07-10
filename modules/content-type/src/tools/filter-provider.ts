/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

export function filter_provider(value: any): [string, Function][] {
    if (Array.isArray(value)) {
        return value.filter(item => Array.isArray(item) && typeof item[0] !== 'string' && typeof item[1] !== 'function')
    } else {
        return []
    }
}
