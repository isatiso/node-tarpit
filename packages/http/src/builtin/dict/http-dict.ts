/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Matcher, MismatchDescription } from '@tarpit/judge'
import { throw_bad_request } from '../../errors'

export class HttpDict<T extends NodeJS.Dict<string | string[]> = NodeJS.Dict<string | string[]>> {

    protected _expose = false

    constructor(
        private dict: T
    ) {
    }

    expose_error(value?: boolean) {
        this._expose = value !== false
    }

    get_first(key: keyof T): string | undefined {
        const item = this.dict[key]
        if (Array.isArray(item)) {
            return item[0]
        } else {
            return item
        }
    }

    ensure(prop: keyof T, matcher: Matcher<string> | RegExp): string {
        const res = this.get_first(prop)
        const mismatch_info = Matcher.mismatch(res, matcher)
        if (mismatch_info) {
            this.on_error(prop, mismatch_info)
        }
        return res as any
    }

    protected on_error(prop: keyof T, desc: MismatchDescription): never {
        throw_bad_request(`Value of [${prop as string}] is not match rule: [${desc.rule}]`, { expose: this._expose })
    }
}
