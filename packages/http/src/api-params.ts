/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Jtl, Judgement, JudgementRule, Path, PathValue } from '@tarpit/judge'
import { ReasonableError } from './error'

export const PURE_PARAMS = 'PURE_PARAMS'

/**
 * 内置参数检查及检查工具。
 *
 * @category Builtin
 */
export class ApiParams<T> extends Judgement<T> {

    /**
     * 指定参数是否匹配指定规则。是：返回参数本身；否：抛出 ReasonableError。
     *
     * @param prop
     * @param match
     */
    ensure<P extends Path<T>>(prop: P, match?: JudgementRule): Exclude<PathValue<T, P>, undefined> {
        match = match || Jtl.exist
        const res = super.get(prop)
        if (res === undefined) {
            throw new ReasonableError(400, `Can not find ${prop}`)
        }
        if (this.if(res, match)) {
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
    ensureAny<P extends Path<T>>(prop: P, match_list: JudgementRule[]): Exclude<PathValue<T, P>, undefined> {
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
    ensureAll<P extends Path<T>>(prop: P, match_list: JudgementRule[]): Exclude<PathValue<T, P>, undefined> {
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
    doIf<P extends Path<T>>(prop: P, match: JudgementRule, then?: (res: PathValue<T, P>) => void) {
        const res = super.get(prop)
        if (res === undefined) {
            return
        }
        if (this.if(res, match)) {
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
    doIfAny<P extends Path<T>>(prop: P, match_list: JudgementRule[], then?: (res: PathValue<T, P>) => void) {
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
    doIfAll<P extends Path<T>>(prop: P, match_list: JudgementRule[], then?: (res: PathValue<T, P>) => void) {
        const res = super.get(prop)
        if (res === undefined) {
            return
        }
        if (this.all(res, match_list)) {
            then?.(res)
        }
    }
}
