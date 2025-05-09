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

    constructor(
        public readonly data: T
    ) {
    }

    get_first(key: keyof T, matcher?: Matcher<string> | RegExp): string | undefined {
        const item = this.data[key]
        const value: string | undefined = Array.isArray(item) ? item[0] : item
        if (matcher && Matcher.mismatch(value, matcher)) {
            return void 0
        }
        return value
    }

    get_all(key: keyof T, matcher?: Matcher<string> | RegExp): string[] | undefined {
        const item = this.data[key]
        if (!item) {
            return void 0
        }
        const values: string[] = Array.isArray(item) ? item : [item]
        if (matcher) {
            return values.filter(v => !Matcher.mismatch(v, matcher))
        } else {
            return values
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
        throw_bad_request(`Value of [${prop as string}] does not match the rule: [${desc.rule}]`)
    }
}
