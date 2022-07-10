/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

/**
 * RegExp to match *( ";" parameter ) in RFC 7231 sec 3.1.1.1
 *
 * parameter     = token "=" ( token / quoted-string )
 * token         = 1*tchar
 * tchar         = "!" / "#" / "$" / "%" / "&" / "'" / "*"
 *               / "+" / "-" / "." / "^" / "_" / "`" / "|" / "~"
 *               / DIGIT / ALPHA
 *               ; any VCHAR, except delimiters
 * quoted-string = DQUOTE *( qdtext / quoted-pair ) DQUOTE
 * qdtext        = HTAB / SP / %x21 / %x23-5B / %x5D-7E / obs-text
 * obs-text      = %x80-FF
 * quoted-pair   = "\" ( HTAB / SP / VCHAR / obs-text )
 *
 * TEXT_REGEXP = /^[\u000b\u0020-\u007e\u0080-\u00ff]+$/
 * TOKEN_REGEXP = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/
 */
const PARAM_REGEXP = /^([!#$%&'*+.^_`|~\dA-Za-z-]+) *= *("(?:[\u000b\u0020\u0021\u0023-\u005b\u005d-\u007e\u0080-\u00ff]|\\[\u000b\u0020-\u00ff])*"|[!#$%&'*+.^_`|~\dA-Za-z-]+) *(?:; *(.*))?$/

/**
 * RegExp to match quoted-pair in RFC 7230 sec 3.2.6
 *
 * quoted-pair = "\" ( HTAB / SP / VCHAR / obs-text )
 * obs-text    = %x80-FF
 */
const QUOTED_STRING_REGEXP = /\\([\u000b\u0020-\u00ff])/g

/**
 * RegExp to match type in RFC 7231 sec 3.1.1.1
 *
 * media-type = type "/" subtype
 * type       = token
 * subtype    = token
 */
const TYPE_REGEXP = /^ *([!#$%&'*+.^_`|~\dA-Za-z-]+\/[!#$%&'*+.^_`|~\dA-Za-z-]+) *(?:; *(.*))?$/

export type ContentType = {
    type: string
    parameters: { [prop: string]: string }
}

export function parse_content_type(header_value: string): ContentType {

    const type_exec_res = TYPE_REGEXP.exec(header_value)

    if (!type_exec_res) {
        return { type: 'application/octet-stream', parameters: {} }
    }

    const content_type: ContentType = { type: type_exec_res[1].toLowerCase(), parameters: {} }
    let rest = type_exec_res[2] ?? ''

    let param_exec_res: RegExpExecArray | null
    while (param_exec_res = PARAM_REGEXP.exec(rest)) {
        const key = param_exec_res[1].toLowerCase()
        let value = param_exec_res[2]
        rest = param_exec_res[3] ?? ''

        if (value[0] === '"') {
            value = value
                .substring(1, value.length - 1)
                .replace(QUOTED_STRING_REGEXP, '$1')
        }

        content_type.parameters[key] = value
    }

    return content_type
}
