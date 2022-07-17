/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import iconv from 'iconv-lite'

function is_utf8(charset: string) {
    charset = charset.toLowerCase()
    return charset === 'utf8' || charset === 'utf-8'
}

function encode(str: string, charset: string) {
    if (is_utf8(charset)) {
        return encodeURIComponent(str)
    }

    const buf: Buffer = iconv.encode(str, charset)
    let encodeStr = ''
    let ch = ''
    for (let i = 0; i < buf.length; i++) {
        ch = buf[i].toString(16)
        if (ch.length === 1) {
            ch = '0' + ch
        }
        encodeStr += '%' + ch
    }
    encodeStr = encodeStr.toUpperCase()
    return encodeStr
}

function decode(str: string, charset: string) {
    if (str.indexOf('%') === -1) {
        return str
    }
    try {
        if (is_utf8(charset)) {
            return decodeURIComponent(str)
        }
        const bytes = []
        for (let i = 0; i < str.length;) {
            if (str[i] === '%') {
                i++
                bytes.push(parseInt(str.substring(i, i + 2), 16))
                i += 2
            } else {
                bytes.push(str.charCodeAt(i))
                i++
            }
        }
        const buf = new Buffer(bytes)
        return iconv.decode(buf, charset)
    } catch (e) {
        return str
    }
}

function is_ascii(str: string) {
    return (/^[\x00-\x7F]*$/).test(str)
}

function encode_component(item: string, charset: string) {
    if (is_ascii(item)) {
        item = encodeURIComponent(item)
    } else {
        item = encode(item, charset)
    }
    return item
}

function _stringify(obj: any, charset: string, prefix: string): string {
    if (Array.isArray(obj)) {
        return stringifyArray(obj, charset, prefix)
    } else if ('[object Object]' === {}.toString.call(obj)) {
        return stringifyObject(obj, charset, prefix)
    } else if ('string' === typeof obj) {
        return stringifyString(obj, charset, prefix)
    } else {
        return prefix + '=' + encode_component(String(obj), charset)
    }
}

function stringifyString(str: string, charset: string, prefix: string) {
    return prefix + '=' + encode_component(str, charset)
}

function stringifyArray(arr: string[], charset: string, prefix: string) {
    return arr.map((item, i) => {
        return _stringify(item, charset, prefix + '[' + i + ']')
    }).join('&')
}

function stringifyObject(obj: NodeJS.Dict<string | string[]>, charset: string, prefix?: string) {
    return Object.keys(obj).map(key => {
        if (obj[key] === null) {
            return encode(key, charset) + '='
        } else {
            prefix = prefix ? prefix + '[' + encode_component(key, charset) + ']' : encode_component(key, charset)
            return _stringify(obj[key], charset, prefix)
        }
    }).join('&')
}

export namespace url_encode {

    export function stringify(obj: NodeJS.Dict<string | string[]>, charset?: string): string {
        charset = charset ?? 'utf-8'
        return stringifyObject(obj, charset)
    }

    export function parse(querystring: string, options?: { maxKeys?: number, charset?: string }): NodeJS.Dict<string | string[]> {

        const obj: NodeJS.Dict<string | string[]> = {}

        const maxKeys = options?.maxKeys ?? 1000
        const charset = options?.charset ?? 'utf-8'

        // maxKeys <= 0 means that we should not limit keys count
        const sub_qs = maxKeys > 0 ? querystring.split('&', maxKeys) : querystring.split('&')

        for (const item of sub_qs) {

            const x = item.replace(/\+/g, '%20')
            const [rk, rv] = x.split('=', 2)

            const k = decode(rk, charset)
            const v = rv ? decode(rv, charset) : ''

            const prev = obj[k]
            if (prev === undefined) {
                obj[k] = v
            } else if (Array.isArray(prev)) {
                prev.push(v)
            } else {
                obj[k] = [prev, v]
            }
        }

        return obj
    }
}
