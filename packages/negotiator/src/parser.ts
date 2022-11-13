import { parse_params, split_escape_quote } from './tools'

/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

export type ParsedField = [key: string, quality: number, ...args: (string | undefined)[]]
export type AcceptEncoding = [key: string, quality: number]
export type AcceptLanguage = [key: string, quality: number, tag: string, subtag: string | undefined]
export type AcceptMediaType = [key: string, quality: number, type: string, subtype: string]

export function parse_encoding(header: string): AcceptEncoding | null {
    const [value, ...raw_params] = split_escape_quote(header, ';')
    if (!value) {
        return null
    }
    const params = parse_params(raw_params)
    return [value, +(params.q ?? 1),]
}

export function parse_language(header: string): AcceptLanguage | null {
    const [value, ...raw_params] = split_escape_quote(header, ';')
    const [tag, subtag] = value?.split('-')
    if (!tag) {
        return null
    }
    const params = parse_params(raw_params)
    return [subtag ? `${tag}-${subtag}` : tag, +(params.q ?? 1), tag, subtag]
}

export function parse_media_type(header: string): AcceptMediaType | null {
    const [value, ...raw_params] = split_escape_quote(header, ';')
    const [type, subtype] = value?.split('/')
    if (!type) {
        return null
    }
    const params = parse_params(raw_params)
    return [subtype ? `${type}/${subtype}` : type, +(params.q ?? 1), type, subtype]
}
