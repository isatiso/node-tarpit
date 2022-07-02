/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { MismatchDescription } from '@tarpit/judge'
import { throw_bad_request } from '../../errors'
import { ApiJudgement, OnJudgementError } from '../api-judgement'
import { TpRequest } from '../tp-request'
import { TextBody } from './text-body'

export class FormBody<T> extends ApiJudgement<T> {

    static parse(request: TpRequest, buf: Buffer): FormBody<any> {
        const str = TextBody.parse(request, buf)
        const params: any = {}
        new URLSearchParams(str).forEach((value, key) => {
            if (params[key] === undefined) {
                params[key] = value
            } else if (typeof params[key] === 'string') {
                params[key] = [params[key], value]
            } else {
                params[key].push(value)
            }
        })
        return new FormBody(params)
    }

    protected override on_error(prop: string, desc: MismatchDescription, on_error?: OnJudgementError): never {
        throw_bad_request(on_error?.(prop, desc) ?? `Body parameter of [${prop}] is not match rule: [${desc.rule}]`, { expose: this._expose })
    }
}
