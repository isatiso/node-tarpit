/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */
function remove_wrapped_dquote(value: string) {
    const v = value.trim()
    if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) {
        return v.slice(1, -1).replace(/\\"/g, '"')
    }
    return v
}

export function split_escape_quote(input: string, splitter: string): string[] {
    const result: string[] = []
    let current_segment = ''
    let in_quotes = false
    let is_escaped = false

    for (const char of input) {
        if (is_escaped) {
            current_segment += char
            is_escaped = false
            continue
        }

        if (char === '\\') {
            is_escaped = true
            current_segment += char
            continue
        }

        if (char === '"') {
            in_quotes = !in_quotes
            current_segment += char
            continue
        }

        if (char === splitter && !in_quotes) {
            result.push(current_segment)
            current_segment = ''
            continue
        }

        current_segment += char
    }

    result.push(current_segment)

    return result.map(s => remove_wrapped_dquote(s.trim()))
}

function split_token_pair(pair: string): [string, string] {
    const idx = pair.indexOf('=')
    if (idx < 0) {
        return [pair.trim().toLowerCase(), '']
    }
    const key = pair.slice(0, idx).trim().toLowerCase()
    const val = remove_wrapped_dquote(pair.slice(idx + 1))
    return [key, val]
}

export function parse_params(raw: string[]) {
    return Object.fromEntries(raw.map(split_token_pair))
}
