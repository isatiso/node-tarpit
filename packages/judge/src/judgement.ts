/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { JudgementRule, Path, PathOfType, PathValue } from './__types__'
import { Matcher, MismatchDescription } from './matcher'
import { Reference } from './reference'

export type MatcherInferType<T extends Matcher<any> | RegExp> = T extends RegExp ? string : T extends Matcher<infer V> ? V : never
export type OnJudgementError = (prop: string, desc: MismatchDescription) => string

/**
 * 继承 Reference 增加值类型检查功能。
 * ```typescript
 * const judge = new Judgement({ a: 'abc', b: 123, c: { c1: 'abc', c2: 123 }, d: '', e: 'asd' })
 * ref.getIf('c.c1', Jtl.number) // undefined
 * ref.getIf('c.c1', Jtl.string) // 'abc'
 * ref.getIf('c.d', Jtl.string) // ''
 * ref.getIf('c.d', Jtl.nonEmptyString) // undefined
 * ref.getIf('c.e', /asd/) // 'asd'
 * ref.getIf('c.e', /[ads]/) // 'asd'
 * ref.getIf('c.e', /abc/) // undefined
 * ```
 */
export class Judgement<T> extends Reference<T> {

    get_if<M extends (Matcher<any> | RegExp), P extends PathOfType<T, MatcherInferType<M>>>(prop: P, matcher: M): Exclude<PathValue<T, P>, undefined> | undefined
    get_if<M extends (Matcher<any> | RegExp), P extends PathOfType<T, MatcherInferType<M>>>(prop: P, matcher: M, def: MatcherInferType<M>): Exclude<PathValue<T, P>, undefined>
    get_if(prop: Path<T>, matcher: JudgementRule, def?: any): any {
        const res = super.get(prop)
        if (res !== undefined && Matcher.if(res, matcher)) {
            return res
        }
        return def
    }

    do_if<M extends (Matcher<any> | RegExp), P extends PathOfType<T, MatcherInferType<M>>>(prop: P, matcher: M, then: (res: PathValue<T, P>) => void): void {
        const res = super.get(prop)
        if (res === undefined) {
            return
        }
        Matcher.if(res, matcher) && then(res)
    }

    ensure<M extends (Matcher<any> | RegExp), P extends PathOfType<T, MatcherInferType<M>>>(prop: P, matcher: M, on_error?: OnJudgementError): Exclude<PathValue<T, P>, undefined> {
        const res = super.get(prop)
        const mismatch_info = Matcher.mismatch(res, matcher)
        if (mismatch_info) {
            this.on_error(prop, mismatch_info, on_error)
        }
        return res as any
    }

    protected on_error(prop: string, desc: MismatchDescription, on_error?: (prop: string, desc: MismatchDescription) => string): never {
        throw new Error(on_error?.(prop, desc) || `Value of [${prop}] is not match rule: [${desc.rule}]`)
    }
}
