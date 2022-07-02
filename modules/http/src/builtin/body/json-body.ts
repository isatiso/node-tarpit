/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { MismatchDescription } from '@tarpit/judge'
import { StandardError, throw_bad_request } from '../../errors'
import { ApiJudgement, OnJudgementError } from '../api-judgement'
import { TpRequest } from '../tp-request'
import { TextBody } from './text-body'

function parse_json_body(str: string): JsonBody<any> {
    if (!str) {
        throw new StandardError(400, 'Request body is empty')
    }
    const json_res = JSON.parse(str)
    if (typeof json_res !== 'object' || Array.isArray(json_res)) {
        throw new StandardError(400, 'Invalid JSON, only supports object')
    }
    return new JsonBody(json_res)
}

export class JsonBody<T> extends ApiJudgement<T> {

    static parse(request: TpRequest, buf: Buffer): any {
        const str = TextBody.parse(request, buf)
        try {
            return parse_json_body(str)
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
