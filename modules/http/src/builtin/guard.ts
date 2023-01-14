/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Judgement, MismatchDescription, OnJudgementError } from '@tarpit/judge'
import { HttpCredentials } from '../__types__'
import { throw_forbidden } from '../errors'

export class Guard extends Judgement<HttpCredentials> {

    constructor(data: HttpCredentials | undefined) {
        super(data)
    }

    protected override on_error(prop: string, desc: MismatchDescription, on_error?: OnJudgementError): never {
        throw_forbidden(on_error?.(prop, desc) ?? `Token field [${prop}] does not match the rule: [${desc.rule}]`)
    }
}
