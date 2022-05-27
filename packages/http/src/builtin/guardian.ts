/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { JudgementRule, Matcher, Path, PathOfType, PathValue } from '@tarpit/judge'
import { TpHttpAuthInfo } from '../__types__'
import { ApiParams } from './api-params'

export class Guardian extends ApiParams<TpHttpAuthInfo> {

    public readonly certified: boolean

    constructor(data: TpHttpAuthInfo | undefined) {
        super(data)
        this.certified = data !== undefined
    }

    ensure<P extends PathOfType<TpHttpAuthInfo, string>>(prop: P, matcher: RegExp): Exclude<PathValue<TpHttpAuthInfo, P>, undefined>
    ensure<V, P extends PathOfType<TpHttpAuthInfo, V>>(prop: P, matcher: Matcher<V>): Exclude<V, undefined>
    ensure<P extends Path<TpHttpAuthInfo>>(prop: P, matcher: JudgementRule): Exclude<PathValue<TpHttpAuthInfo, P>, undefined> {
        return super.ensure(prop, matcher as any, () => [401, 'Unauthorized.'])
    }

    ensure_any<P extends PathOfType<TpHttpAuthInfo, string>>(prop: P, matcher_list: Array<RegExp | Matcher<string>>): Exclude<PathValue<TpHttpAuthInfo, P>, undefined>
    ensure_any<P extends Path<TpHttpAuthInfo>>(prop: P, matcher_list: Matcher<Exclude<PathValue<TpHttpAuthInfo, P>, undefined>>[]): Exclude<PathValue<TpHttpAuthInfo, P>, undefined>
    ensure_any<P extends Path<TpHttpAuthInfo>>(prop: P, matcher_list: JudgementRule[]): Exclude<PathValue<TpHttpAuthInfo, P>, undefined> {
        return super.ensure_any(prop, matcher_list, () => [401, 'Unauthorized.'])
    }

    ensure_all<P extends PathOfType<TpHttpAuthInfo, string>>(prop: P, matcher_list: Array<RegExp | Matcher<string>>): Exclude<PathValue<TpHttpAuthInfo, P>, undefined>
    ensure_all<P extends Path<TpHttpAuthInfo>>(prop: P, matcher_list: Matcher<Exclude<PathValue<TpHttpAuthInfo, P>, undefined>>[]): Exclude<PathValue<TpHttpAuthInfo, P>, undefined>
    ensure_all<P extends Path<TpHttpAuthInfo>>(prop: P, matcher_list: JudgementRule[]): Exclude<PathValue<TpHttpAuthInfo, P>, undefined> {
        return super.ensure_all(prop, matcher_list, () => [401, 'Unauthorized.'])
    }
}
