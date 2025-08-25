/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */
import { parse_params, split_escape_quote } from './tools'

export type ParsedField = [key: string, quality: number, ...rest: (string | undefined)[]]
export type AcceptEncoding = [encoding: string, quality: number]
export type AcceptLanguage = [lang: string, quality: number, tag: string, subtag?: string]
export type AcceptMediaType = [mt: string, quality: number, type: string, subtype?: string]

function clampQ(q: unknown): number {
    const v = Number(q)
    if (!isFinite(v)) {
        return 1
    }
    if (v < 0) {
        return 0
    }
    if (v > 1) {
        return 1
    }
    return v
}

export function parse_encoding(header: string): AcceptEncoding | null {
    const [value, ...raw_params] = split_escape_quote(header, ';')
    if (!value) {
        return null
    }
    const params = parse_params(raw_params)
    const q = clampQ(params.q)
    if (q === 0) {
        return null
    }
    return [value.trim().toLowerCase(), q]
}

export function parse_language(header: string): AcceptLanguage | null {
    const [value, ...raw_params] = split_escape_quote(header, ';')
    if (!value) {
        return null
    }
    const params = parse_params(raw_params)
    const q = clampQ(params.q)
    if (q === 0) {
        return null
    }
    const parts = value.trim().split('-')
    const tag = parts[0].toLowerCase()
    const subtag = parts[1] ? parts[1].toUpperCase() : undefined
    const lang = subtag ? `${tag}-${subtag}` : tag
    return [lang, q, tag, subtag]
}

export function parse_media_type(header: string): AcceptMediaType | null {
    const [value, ...raw_params] = split_escape_quote(header, ';')
    if (!value) {
        return null
    }
    const params = parse_params(raw_params)
    const q = clampQ(params.q)
    if (q === 0) {
        return null
    }
    const [type, subtype] = value.trim().toLowerCase().split('/')
    return [value.trim(), q, type, subtype]
}
