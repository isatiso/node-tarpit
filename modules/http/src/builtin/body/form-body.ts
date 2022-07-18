/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { form_deserialize, MIMEContent } from '@tarpit/content-type'
import { SymbolToken } from '@tarpit/core'
import { Judgement, MismatchDescription, OnJudgementError } from '@tarpit/judge'
import { throw_bad_request } from '../../errors'

@SymbolToken('http')
export class FormBody<T> extends Judgement<T> {

    constructor(content: MIMEContent<any>) {
        super(form_deserialize(content))
    }

    protected override on_error(prop: string, desc: MismatchDescription, on_error?: OnJudgementError): never {
        throw_bad_request(on_error ? on_error(prop, desc) : `Body parameter of [${prop}] does not match the rule: [${desc.rule}]`)
    }
}
