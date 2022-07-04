/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { form_deserialize, MIMEContent } from '@tarpit/content-type'
import { MismatchDescription, OnJudgementError } from '@tarpit/judge'
import { throw_bad_request } from '../../errors'
import { ApiJudgement } from '../api-judgement'
import { TpRequest } from '../tp-request'

export class FormBody<T> extends ApiJudgement<T> {

    static parse(request: TpRequest, content: MIMEContent<any>): FormBody<any> {
        return new FormBody(form_deserialize(content))
    }

    protected override on_error(prop: string, desc: MismatchDescription, on_error?: OnJudgementError): never {
        throw_bad_request(on_error?.(prop, desc) ?? `Body parameter of [${prop}] is not match rule: [${desc.rule}]`, { expose: this._expose })
    }
}
