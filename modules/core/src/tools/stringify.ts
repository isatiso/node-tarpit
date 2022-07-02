/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

export function stringify(token: any): string {
    if (typeof token === 'string') {
        return token
    }

    if (Array.isArray(token)) {
        return '[' + token.map(stringify).join(', ') + ']'
    }

    if (token == null) {
        return '' + token
    }

    if (token.override_name) {
        return `${token.override_name}`
    }

    if (token.name) {
        return `${token.name}`
    }

    const res = token.toString()

    if (res == null) {
        return '' + res
    }

    const new_line_index = res.indexOf('\n')
    return new_line_index === -1 ? res : res.substring(0, new_line_index)
}
