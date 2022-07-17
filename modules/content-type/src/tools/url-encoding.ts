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

function is_normal(str: string) {
    return (/^[a-zA-Z\d-_!~*'()]*$/).test(str)
}

function encode(str: string, charset: string) {
    if (is_normal(str)) {
        return str
    }
    if (is_utf8(charset)) {
        return encodeURIComponent(str)
    }
    const buf = iconv.encode(str, charset)
    let res = ''
    for (let i = 0; i < buf.length; i++) {
        res += '%' + buf[i].toString(16).padStart(2, '0')
    }
    return res
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
        const buf = Buffer.from(bytes)
        return iconv.decode(buf, charset)
    } catch (e) {
        return str
    }
}

export namespace URLEncoding {

    export function stringify(obj: NodeJS.Dict<string | string[]>, charset?: string): string {
        const x_charset = charset ?? 'utf-8'
        let res = ''
        let first = ''
        for (const k in obj) {
            let value = obj[k]
            let key = encode(k, x_charset)
            if (Array.isArray(value)) {
                for (const v of value) {
                    first = '&'
                    res += first + key + '=' + encode(v, x_charset)
                }
            } else {
                first = '&'
                value = value ?? ''
                res += first + key + '=' + encode(value, x_charset)
            }
        }
        return res.substring(1)
    }

    export function parse(querystring: string, options?: { max_keys?: number, charset?: string }): NodeJS.Dict<string | string[]> {

        const obj: NodeJS.Dict<string | string[]> = {}

        const max_keys = options?.max_keys ?? 1000
        const charset = options?.charset ?? 'utf-8'

        // maxKeys <= 0 means that we should not limit keys count
        const sub_qs = max_keys > 0 ? querystring.split('&', max_keys) : querystring.split('&')

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
