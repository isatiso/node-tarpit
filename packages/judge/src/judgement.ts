/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { JudgementRule, Path, PathOfType, PathValue } from './__types__'
import { Matcher } from './matcher'
import { Reference } from './reference'

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

    getIf<P extends PathOfType<T, string>>(prop: P, matcher: RegExp): Exclude<PathValue<T, P>, undefined> | undefined
    getIf<P extends PathOfType<T, string>>(prop: P, matcher: RegExp, def: Exclude<PathValue<T, P>, undefined>): Exclude<PathValue<T, P>, undefined>
    getIf<V, P extends PathOfType<T, V>>(prop: P, matcher: Matcher<V>): Exclude<V, undefined> | undefined
    getIf<V, P extends PathOfType<T, V>>(prop: P, matcher: Matcher<V>, def: Exclude<V, undefined>): Exclude<V, undefined>
    getIf(prop: Path<T>, matcher: JudgementRule, def?: any): any {
        const res = super.get(prop)
        if (res !== undefined && this.if(res, matcher)) {
            return res
        }
        return def
    }

    getIfAny<P extends PathOfType<T, string>>(prop: P, matcher_list: Array<RegExp | Matcher<string>>): Exclude<PathValue<T, P>, undefined> | undefined
    getIfAny<P extends PathOfType<T, string>>(prop: P, matcher_list: Array<RegExp | Matcher<string>>, def: Exclude<PathValue<T, P>, undefined>): Exclude<PathValue<T, P>, undefined>
    getIfAny<P extends Path<T>>(prop: P, matcher_list: Matcher<Exclude<PathValue<T, P>, undefined>>[]): Exclude<PathValue<T, P>, undefined> | undefined
    getIfAny<P extends Path<T>>(prop: P, matcher_list: Matcher<Exclude<PathValue<T, P>, undefined>>[], def: Exclude<PathValue<T, P>, undefined>): Exclude<PathValue<T, P>, undefined>
    getIfAny(prop: Path<T>, matcher_list: JudgementRule[], def?: any): any {
        const res = super.get(prop)
        return this.any(res, matcher_list) ? res : def
    }

    getIfAll<P extends PathOfType<T, string>>(prop: P, matcher_list: Array<RegExp | Matcher<string>>): Exclude<PathValue<T, P>, undefined> | undefined
    getIfAll<P extends PathOfType<T, string>>(prop: P, matcher_list: Array<RegExp | Matcher<string>>, def: Exclude<PathValue<T, P>, undefined>): Exclude<PathValue<T, P>, undefined>
    getIfAll<P extends Path<T>>(prop: P, matcher_list: Matcher<Exclude<PathValue<T, P>, undefined>>[]): Exclude<PathValue<T, P>, undefined> | undefined
    getIfAll<P extends Path<T>>(prop: P, matcher_list: Matcher<Exclude<PathValue<T, P>, undefined>>[], def: Exclude<PathValue<T, P>, undefined>): Exclude<PathValue<T, P>, undefined>
    getIfAll(prop: Path<T>, matcher_list: JudgementRule[], def?: any): any {
        const res = super.get(prop)
        return this.all(res, matcher_list) ? res : def
    }

    /**
     * 检查一个字段的值是否匹配指定规则。
     *
     * @param value
     * @param rule
     * @protected
     */
    protected if(value: any, rule: JudgementRule): any {
        if (rule instanceof RegExp) {
            return typeof value === 'string' && rule.test(value)
        } else {
            return rule.check(value)
        }
    }

    /**
     * 检查一个字段的值是否匹配指定规则中的任意一个。
     *
     * @param value
     * @param rules
     * @protected
     */
    protected any(value: any, rules: JudgementRule[]) {
        return rules.some(rule => this.if(value, rule))
    }

    /**
     * 检查一个字段的值是否匹配全部指定规则。
     *
     * @param value
     * @param rules
     * @protected
     */
    protected all(value: any, rules: JudgementRule[]) {
        return rules.every(rule => this.if(value, rule))
    }
}
