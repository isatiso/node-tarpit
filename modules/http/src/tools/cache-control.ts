/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

export interface CacheControl {
    [prop: string]: boolean | number | undefined
}

export interface RequestCacheControl extends CacheControl {
    'max-age'?: number
    'max-stale'?: number
    'min-fresh'?: number
    'no-cache'?: boolean
    'no-store'?: boolean
    'no-transform'?: boolean
    'only-if-cached'?: boolean
}

export interface ResponseCacheControl extends CacheControl {
    'must-revalidate'?: boolean
    'no-cache'?: boolean
    'no-store'?: boolean
    'no-transform'?: boolean
    'public'?: boolean
    'private'?: boolean
    'proxy-revalidate'?: boolean
    'max-age'?: number
    's-maxage'?: number
}

const convert_functions: { [prop: string]: (v: string) => number | undefined } = {
    'max-age': (v: string) => /^\d+$/.test(v) ? +v : undefined,
    'max-stale': (v: string) => /^\d+$/.test(v) ? +v : Number.MAX_VALUE,
    'min-fresh': (v: string) => /^\d+$/.test(v) ? +v : undefined,
    's-maxage': (v: string) => /^\d+$/.test(v) ? +v : undefined,
}

const default_convert_function = (_: string) => true

function parse_field(field: string): readonly [string, (number | undefined)] {
    const [k, v] = field.trim().split('=').map(item => item.trim())
    const func = convert_functions[k] ?? default_convert_function
    return [k, func(v)] as const
}

export function make_cache_control(options?: CacheControl): string {
    options = options ?? {}
    return Object.entries(options).map(([key, value]) => {
        if (value === true) {
            return key
        } else if (typeof value === 'number') {
            return `${key}=${value}`
        } else {
            return
        }
    }).filter(key => key).join(',')
}

export function parse_cache_control<T extends RequestCacheControl | ResponseCacheControl>(value: string | undefined): T | undefined {
    if (!value) {
        return
    }
    const entries = value.toLowerCase().split(',')
        .map(field => parse_field(field))
        .filter(field => field[1] !== undefined)
    return Object.fromEntries(entries) as unknown as T
}
