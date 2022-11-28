/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { IncomingHttpHeaders } from 'http'
import { parse_encoding, parse_language, parse_media_type, ParsedField } from './parser'
import { split_escape_quote } from './tools'

export class Negotiator {

    private readonly _parsed_media_types = this.parse_header(this.headers['accept'] ?? '*/*', parse_media_type)
    private readonly _parsed_encodings = this.parse_header(this.headers['accept-encoding'] as string ?? '*', parse_encoding)
    private readonly _parsed_languages = this.parse_header(this.headers['accept-language'] ?? '*', parse_language)

    private readonly _language_map = Object.fromEntries(this._parsed_languages.map(item => [item[0], item[1]] as const))
    private readonly _language_tag_map = Object.fromEntries(this._parsed_languages.map(item => [item[2], item[1]] as const).filter(item => item[0]))
    private readonly _encoding_map = Object.fromEntries(this._parsed_encodings)
    private readonly _media_type_map = Object.fromEntries(this._parsed_media_types.map(item => [item[0], item[1]] as const))

    private readonly _media_types: string[]
    private readonly _encodings: string[]
    private readonly _languages: string[]

    constructor(
        private headers: IncomingHttpHeaders
    ) {
        if (!this._parsed_encodings.find(item => item[0] === 'identity' || item[0] === '*')) {
            const min_quality = this._parsed_encodings[this._parsed_encodings.length - 1]?.[1]
            this._parsed_encodings.push(['identity', min_quality])
        }
        this._media_types = this._parsed_media_types.map(([full]) => full)
        this._encodings = this._parsed_encodings.map(([full]) => full)
        this._languages = this._parsed_languages.map(([full]) => full)
    }

    get media_types(): string[] {
        return this._media_types
    }

    get encodings(): string[] {
        return this._encodings
    }

    get languages(): string[] {
        return this._languages
    }

    preferred_languages(provided: string[]) {
        return provided.map(lang => [lang, lang.split('-', 1)[0]])
            .map(([full, tag]) => [full, this._language_map[full] ?? this._language_tag_map[tag] ?? this._language_map['*']] as const)
            .filter(([, q]) => q > 0)
            .sort((a, b) => b[1] - a[1])
            .map(item => item[0])
    }

    preferred_encodings(provided: string[]) {
        return provided.map(encoding => [encoding, this._encoding_map[encoding] ?? this._encoding_map['*']] as const)
            .filter(([, q]) => q > 0)
            .sort((a, b) => b[1] - a[1])
            .map(item => item[0])
    }

    preferred_media_types(provided: string[]) {
        return provided.map(type => type.split('/'))
            .map(([type, subtype]) => [`${type}/${subtype}`, `${type}/*`])
            .map(([full, type]) => [full, this._media_type_map[full] ?? this._media_type_map[type] ?? this._media_type_map['*/*']] as const)
            .filter(([, q]) => q > 0)
            .sort((a, b) => b[1] - a[1])
            .map(item => item[0])
    }

    private parse_header<T extends ParsedField>(header: string, parser: (value: string) => T | null) {
        return split_escape_quote(header, ',')
            .map(field => parser(field))
            .filter((item): item is T => !!item)
            .sort((a, b) => b[1] - a[1])
    }
}
