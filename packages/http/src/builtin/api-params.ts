/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Judgement, JudgementRule, Matcher, Path, PathOfType, PathValue } from '@tarpit/judge'
import { ReasonableError } from '../error'

export class ApiParams<T> extends Judgement<T> {

    ensure<P extends PathOfType<T, string>>(prop: P, matcher: RegExp, on_error?: (prop: P) => [code: number, message: string]): Exclude<PathValue<T, P>, undefined>
    ensure<V, P extends PathOfType<T, V>>(prop: P, matcher: Matcher<V>, on_error?: (prop: P) => [code: number, message: string]): Exclude<V, undefined>
    ensure<P extends Path<T>>(prop: P, matcher: JudgementRule, on_error?: (prop: P) => [code: number, message: string]): Exclude<PathValue<T, P>, undefined> {
        const res = super.get(prop)
        if (res === undefined || !this.if(res, matcher)) {
            const [code, message] = on_error?.(prop) ?? [400, `prop "${prop}" is illegal.`]
            throw new ReasonableError(code, message)
        }
        return res as any
    }

    ensure_any<P extends PathOfType<T, string>>(prop: P, matcher_list: Array<RegExp | Matcher<string>>, on_error?: (prop: P) => [code: number, message: string]): Exclude<PathValue<T, P>, undefined>
    ensure_any<P extends Path<T>>(prop: P, matcher_list: Matcher<Exclude<PathValue<T, P>, undefined>>[], on_error?: (prop: P) => [code: number, message: string]): Exclude<PathValue<T, P>, undefined>
    ensure_any<P extends Path<T>>(prop: P, matcher_list: JudgementRule[], on_error?: (prop: P) => [code: number, message: string]): Exclude<PathValue<T, P>, undefined> {
        const res = super.get(prop)
        if (res === undefined || !this.any(res, matcher_list)) {
            const [code, message] = on_error?.(prop) ?? [400, `prop "${prop}" is illegal.`]
            throw new ReasonableError(code, message)
        }
        return res as any
    }

    ensure_all<P extends PathOfType<T, string>>(prop: P, matcher_list: Array<RegExp | Matcher<string>>, on_error?: (prop: P) => [code: number, message: string]): Exclude<PathValue<T, P>, undefined>
    ensure_all<P extends Path<T>>(prop: P, matcher_list: Matcher<Exclude<PathValue<T, P>, undefined>>[], on_error?: (prop: P) => [code: number, message: string]): Exclude<PathValue<T, P>, undefined>
    ensure_all<P extends Path<T>>(prop: P, matcher_list: JudgementRule[], on_error?: (prop: P) => [code: number, message: string]): Exclude<PathValue<T, P>, undefined> {
        const res = super.get(prop)
        if (res === undefined || !this.all(res, matcher_list)) {
            const [code, message] = on_error?.(prop) ?? [400, `prop "${prop}" is illegal.`]
            throw new ReasonableError(code, message)
        }
        return res as any
    }

    do_if<P extends PathOfType<T, string>>(prop: P, matcher: RegExp, then: (res: PathValue<T, P>) => void): void
    do_if<V, P extends PathOfType<T, V>>(prop: P, matcher: Matcher<V>, then: (res: PathValue<T, P>) => void): void
    do_if<P extends Path<T>>(prop: P, matcher: JudgementRule, then: (res: PathValue<T, P>) => void) {
        const res = super.get(prop)
        if (res === undefined) {
            return
        }
        this.if(res, matcher) && then(res)
    }

    do_if_any<P extends PathOfType<T, string>>(prop: P, matcher_list: Array<RegExp | Matcher<string>>, then: (res: PathValue<T, P>) => void): void
    do_if_any<P extends Path<T>>(prop: P, matcher_list: Matcher<Exclude<PathValue<T, P>, undefined>>[], then: (res: PathValue<T, P>) => void): void
    do_if_any<P extends Path<T>>(prop: P, match_list: JudgementRule[], then: (res: PathValue<T, P>) => void) {
        const res = super.get(prop)
        if (res === undefined) {
            return
        }
        this.any(res, match_list) && then(res)
    }

    do_if_all<P extends PathOfType<T, string>>(prop: P, matcher_list: Array<RegExp | Matcher<string>>, then: (res: PathValue<T, P>) => void): void
    do_if_all<P extends Path<T>>(prop: P, matcher_list: Matcher<Exclude<PathValue<T, P>, undefined>>[], then: (res: PathValue<T, P>) => void): void
    do_if_all<P extends Path<T>>(prop: P, match_list: JudgementRule[], then: (res: PathValue<T, P>) => void) {
        const res = super.get(prop)
        if (res === undefined) {
            return
        }
        this.all(res, match_list) && then(res)
    }
}
