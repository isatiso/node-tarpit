/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Judgement, MismatchDescription } from '@tarpit/judge'
import { throw_bad_request } from '../errors'

export class ApiJudgement<T> extends Judgement<T> {

    protected _expose = false

    expose_error(value?: boolean) {
        this._expose = value !== false
    }

    protected on_error(prop: string, desc: MismatchDescription, on_error?: (prop: string, desc: MismatchDescription) => string): never {
        throw_bad_request(on_error?.(prop, desc) ?? `Value of [${prop}] is not match rule: [${desc.rule}]`, { expose: this._expose })
    }
}
