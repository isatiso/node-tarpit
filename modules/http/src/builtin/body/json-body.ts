/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { decode, MIMEContent } from '@tarpit/content-type'
import { Judgement, MismatchDescription, OnJudgementError } from '@tarpit/judge'
import { throw_bad_request, TpHttpFinish } from '../../errors'

function parse_json_body(content: MIMEContent<any>): any {
    content.text = decode(content.raw, content.charset ?? 'utf-8')
    if (typeof content.text !== 'string') {
        throw_bad_request({ msg: 'Fail to decode content' })
    }
    content.data = JSON.parse(content.text)
    if (Object.prototype.toString.call(content.data) !== '[object Object]') {
        throw_bad_request({ msg: 'Invalid JSON, only supports object' })
    }
    return content.data
}

export class JsonBody<T> extends Judgement<T> {

    constructor(content: MIMEContent<any>) {
        try {
            super(parse_json_body(content))
        } catch (e) {
            if (e instanceof TpHttpFinish) {
                throw e
            } else {
                throw_bad_request({ msg: 'Fail to parse body in JSON format', origin: e })
            }
        }
    }

    protected override on_error(prop: string, desc: MismatchDescription, on_error?: OnJudgementError): never {
        throw_bad_request(on_error ? on_error(prop, desc) : `Body parameter of [${prop}] does not match the rule: [${desc.rule}]`)
    }
}
