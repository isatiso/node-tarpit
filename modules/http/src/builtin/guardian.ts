/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { MismatchDescription } from '@tarpit/judge'
import { TpHttpAuthInfo } from '../__types__'
import { throw_unauthorized } from '../errors'
import { ApiJudgement, OnJudgementError } from './api-judgement'

export class Guardian extends ApiJudgement<TpHttpAuthInfo> {

    public readonly certified: boolean

    constructor(data: TpHttpAuthInfo | undefined) {
        super(data)
        this.certified = data !== undefined
    }

    protected override on_error(prop: string, desc: MismatchDescription, on_error?: OnJudgementError): never {
        throw_unauthorized(on_error?.(prop, desc) ?? `Token field [${prop}] is not match rule: [${desc.rule}]`, { expose: this._expose })
    }
}