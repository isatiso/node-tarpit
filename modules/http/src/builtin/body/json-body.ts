/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { json_deserialize, MIMEContent } from '@tarpit/content-type'
import { MismatchDescription, OnJudgementError } from '@tarpit/judge'
import { StandardError, throw_bad_request } from '../../errors'
import { ApiJudgement } from '../api-judgement'
import { TpRequest } from '../tp-request'

function parse_json_body(content: MIMEContent<any>): JsonBody<any> {
    const json_res = json_deserialize(content)
    if (Object.prototype.toString.call(json_res) !== '[object Object]') {
        throw new StandardError(400, 'Invalid JSON, only supports object')
    }
    return new JsonBody(json_res)
}

export class JsonBody<T> extends ApiJudgement<T> {

    static parse(request: TpRequest, content: MIMEContent<any>): any {
        try {
            return parse_json_body(content)
        } catch (e) {
            if (!(e instanceof StandardError)) {
                throw new StandardError(400, 'parse body error', { origin: e })
            } else {
                throw e
            }
        }
    }

    protected override on_error(prop: string, desc: MismatchDescription, on_error?: OnJudgementError): never {
        throw_bad_request(on_error?.(prop, desc) ?? `Body parameter of [${prop}] is not match rule: [${desc.rule}]`, { expose: this._expose })
    }
}
