/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Judgement, JudgementMatcher, Path, PathValue } from '../builtin'
import { ReasonableError } from './error'

export const PURE_PARAMS = 'PURE_PARAMS'

/**
 * 内置参数检查及检查工具。
 *
 * @category Builtin
 */
export class ApiParams<T> extends Judgement<T> {

    /**
     * 指定参数是否匹配指定规则。是：返回参数本身；否：返回 `undefined`。
     *
     * @param prop
     * @param match
     */
    getIf<P extends Path<T>>(prop: P, match: JudgementMatcher): PathValue<T, P> | undefined
    /**
     * 指定参数是否匹配指定规则。是：返回参数本身；否：返回默认值 def。
     *
     * @param prop
     * @param match
     * @param def
     */
    getIf<P extends Path<T>>(prop: P, match: JudgementMatcher, def: Exclude<PathValue<T, P>, undefined>): Exclude<PathValue<T, P>, undefined>
    getIf<P extends Path<T>>(prop: P, match: JudgementMatcher, def?: PathValue<T, P>) {
        const res = super.get(prop)
        if (res !== undefined && this.testValue(res, match)) {
            return res
        }
        return def
    }

    /**
     * 指定参数是否匹配指定规则中的任意一个。是：返回参数本身；否：返回 `undefined`。
     *
     * @param prop 需要匹配的属性
     * @param match_list 预设的多个匹配规则
     */
    getIfAny<P extends Path<T>>(prop: P, match_list: JudgementMatcher[]): PathValue<T, P> | undefined
    /**
     * 指定参数是否匹配指定规则中的任意一个。是：返回参数本身；否：返回默认值 def。
     *
     * @param prop
     * @param match_list
     * @param def
     */
    getIfAny<P extends Path<T>>(prop: P, match_list: JudgementMatcher[], def: Exclude<PathValue<T, P>, undefined>): Exclude<PathValue<T, P>, undefined>
    getIfAny<P extends Path<T>>(prop: P, match_list: JudgementMatcher[], def?: PathValue<T, P>) {
        const res = super.get(prop)
        if (res !== undefined && this.any(res, match_list)) {
            return res
        }
        return def
    }

    /**
     * 指定参数是否匹配全部指定规则。是：返回参数本身；否：返回 `undefined`。
     *
     * @param prop
     * @param match_list
     */
    getIfAll<P extends Path<T>>(prop: P, match_list: JudgementMatcher[]): PathValue<T, P> | undefined
    /**
     * 指定参数是否匹配全部指定规则。是：返回参数本身；否：返回默认值 def。
     *
     * @param prop
     * @param match_list
     * @param def
     */
    getIfAll<P extends Path<T>>(prop: P, match_list: JudgementMatcher[], def: Exclude<PathValue<T, P>, undefined>): Exclude<PathValue<T, P>, undefined>
    getIfAll<P extends Path<T>>(prop: P, match_list: JudgementMatcher[], def?: PathValue<T, P>) {
        const res = super.get(prop)
        if (res !== undefined && this.all(res, match_list)) {
            return res
        }
        return def
    }

    /**
     * 指定参数是否匹配指定规则。是：返回参数本身；否：抛出 ReasonableError。
     *
     * @param prop
     * @param match
     */
    ensure<P extends Path<T>>(prop: P, match?: JudgementMatcher): Exclude<PathValue<T, P>, undefined> {
        match = match || 'exist'
        const res = super.get(prop)
        if (res === undefined) {
            throw new ReasonableError(400, `Can not find ${prop}`)
        }
        if (this.testValue(res, match)) {
            return res as any
        }
        throw new ReasonableError(400, `prop "${prop}" is illegal.`)
    }

    /**
     * 指定参数是否匹配指定规则中的任意一个。是：返回参数本身；否：抛出 ReasonableError。
     *
     * @param prop
     * @param match_list
     */
    ensureAny<P extends Path<T>>(prop: P, match_list: JudgementMatcher[]): Exclude<PathValue<T, P>, undefined> {
        const res = super.get(prop)
        if (res === undefined) {
            throw new ReasonableError(400, `Can not find ${prop}`)
        }
        if (this.any(res, match_list)) {
            return res as any
        }
        throw new ReasonableError(400, `prop "${prop}" is illegal.`)
    }

    /**
     * 指定参数是否匹配全部指定规则。是：返回参数本身；否：抛出 ReasonableError。
     *
     * @param prop
     * @param match_list
     */
    ensureAll<P extends Path<T>>(prop: P, match_list: JudgementMatcher[]): Exclude<PathValue<T, P>, undefined> {
        const res = super.get(prop)
        if (res === undefined) {
            throw new ReasonableError(400, `Can not find ${prop}`)
        }
        if (this.all(res, match_list)) {
            return res as any
        }
        throw new ReasonableError(400, `prop "${prop}" is illegal.`)
    }

    /**
     * 指定参数是否匹配指定规则。是：执行 then；否：什么都不做。
     *
     * @param prop
     * @param match
     * @param then
     */
    doIf<P extends Path<T>>(prop: P, match: JudgementMatcher, then?: (res: PathValue<T, P>) => void) {
        const res = super.get(prop)
        if (res === undefined) {
            return
        }
        if (this.testValue(res, match)) {
            then?.(res)
        }
    }

    /**
     * 指定参数是否匹配指定规则中的任意一个。是：执行 then；否：什么都不做。
     *
     * @param prop
     * @param match_list
     * @param then
     */
    doIfAny<P extends Path<T>>(prop: P, match_list: JudgementMatcher[], then?: (res: PathValue<T, P>) => void) {
        const res = super.get(prop)
        if (res === undefined) {
            return
        }
        if (this.any(res, match_list)) {
            then?.(res)
        }
    }

    /**
     * 指定参数是否匹配全部指定规则。是：执行 then；否：什么都不做。
     *
     * @param prop
     * @param match_list
     * @param then
     */
    doIfAll<P extends Path<T>>(prop: P, match_list: JudgementMatcher[], then?: (res: PathValue<T, P>) => void) {
        const res = super.get(prop)
        if (res === undefined) {
            return
        }
        if (this.all(res, match_list)) {
            then?.(res)
        }
    }
}
