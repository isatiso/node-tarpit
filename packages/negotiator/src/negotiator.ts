import { IncomingHttpHeaders } from 'http'
import { AcceptEncoding, AcceptLanguage, AcceptMediaType, parse_encoding, parse_language, parse_media_type, ParsedField } from './parser'
import { split_escape_quote } from './tools'

export class Negotiator {

    private readonly _parsed_media_types: AcceptMediaType[]
    private readonly _parsed_encodings: AcceptEncoding[]
    private readonly _parsed_languages: AcceptLanguage[]

    private readonly _language_map: { [p: string]: { q: number; index: number } }
    private readonly _language_tag_map: { [p: string]: { q: number; index: number } }
    private readonly _encoding_map: { [p: string]: { q: number; index: number } }
    private readonly _media_type_map: { [p: string]: { q: number; index: number } }

    private readonly _media_types: string[]
    private readonly _encodings: string[]
    private readonly _languages: string[]

    get media_types(): string[] {
        return this._media_types
    }

    get encodings(): string[] {
        return this._encodings
    }

    get languages(): string[] {
        return this._languages
    }

    constructor(
        private headers: IncomingHttpHeaders
    ) {
        this._parsed_media_types = this._parse_header('accept', '*/*', parse_media_type)
        this._parsed_encodings = this._parse_header('accept-encoding', '*', parse_encoding)
        this._parsed_languages = this._parse_header('accept-language', '*', parse_language)
        this._language_map = Object.fromEntries(this._parsed_languages.map((item, index) => [item[0], { q: item[1], index }] as const))
        this._language_tag_map = Object.fromEntries(this._parsed_languages.map((item, index) => [item[2], { q: item[1], index }] as const))
        this._encoding_map = Object.fromEntries(this._parsed_encodings.map((item, index) => [item[0], { q: item[1], index }] as const))
        this._media_type_map = Object.fromEntries(this._parsed_media_types.map((item, index) => [item[0], { q: item[1], index }] as const))
        if (!this._parsed_encodings.find(item => item[0] === 'identity' || item[0] === '*')) {
            const min_quality = this._parsed_encodings.slice(-1)[0][1]
            this._parsed_encodings.push(['identity', min_quality])
        }
        this._media_types = this._parsed_media_types.map(([full]) => full)
        this._encodings = this._parsed_encodings.map(([full]) => full)
        this._languages = this._parsed_languages.map(([full]) => full)
    }

    preferred_languages(provided: string[]) {
        return provided.map(lang => [lang, lang.split('-', 1)[0]])
            .map(([full, tag]) => [full, this._language_map[full] ?? this._language_tag_map[tag] ?? this._language_map['*']] as const)
            .filter(([, data]) => data && data.q > 0)
            .sort((a, b) => b[1].q - a[1].q || a[1].index - b[1].index)
            .map(item => item[0])
    }

    preferred_encodings(provided: string[]) {
        return provided.map(encoding => [encoding, this._encoding_map[encoding] ?? this._encoding_map['*']] as const)
            .filter(([, data]) => data && data.q > 0)
            .sort((a, b) => b[1].q - a[1].q || a[1].index - b[1].index)
            .map(item => item[0])
    }

    preferred_media_types(provided: string[]) {
        return provided.map(type => type.split('/'))
            .map(([type, subtype]) => [`${type}/${subtype}`, `${type}/*`])
            .map(([full, type]) => [full, this._media_type_map[full] ?? this._media_type_map[type] ?? this._media_type_map['*/*']] as const)
            .filter(([, data]) => data && data.q > 0)
            .sort((a, b) => b[1].q - a[1].q || a[1].index - b[1].index)
            .map(item => item[0])
    }

    private _get_header(key: string, fallback: string): string {
        return (this.headers[key] as string) ?? fallback
    }

    private _parse_header<T extends ParsedField>(key: string, fallback: string, parser: (value: string) => T | null) {
        return split_escape_quote(this._get_header(key, fallback), ',')
            .filter(s => s.length > 0)
            .map((field, i) => [parser(field), i] as const)
            .filter((x): x is [T, number] => !!x[0])
            .sort((a, b) => (b[0][1] - a[0][1]) || (a[1] - b[1]))
            .map(([item]) => item)
    }
}
