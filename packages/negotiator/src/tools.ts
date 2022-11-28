/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

function count_dquote(value: string) {
    let count = 0
    for (let i = 0; i < value.length; i++) {
        if (value[i] === '"' && value[i - 1] !== '\\') {
            count++
        }
    }
    return count
}

export function split_escape_quote(value: string, spliter: string) {
    const accepts: string[] = []
    for (const part of value.split(spliter)) {
        if (!accepts.length) {
            accepts.push(part)
        } else {
            if (count_dquote(accepts[accepts.length - 1]) % 2) {
                accepts[accepts.length - 1] += spliter + part
            } else {
                accepts.push(part)
            }
        }
    }
    return accepts
}

function remove_wrapped_dquote(value: string) {
    if (value[0] === '"' && value[value.length - 1] === '"') {
        return value.substring(1, value.length - 1)
    } else {
        return value
    }
}

function split_token_pair(pair: string) {
    const equal_mark_index = pair.indexOf('=')
    return [pair.substring(0, equal_mark_index), remove_wrapped_dquote(pair.substring(equal_mark_index + 1))]
}

export function parse_params(raw: string[]) {
    return Object.fromEntries(raw.map(pair => split_token_pair(pair)))
}
