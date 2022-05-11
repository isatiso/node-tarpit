/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Matcher } from './matcher'

export type ValueType =
    | 'exist'
    | 'function'
    | 'object'
    | 'array'
    | 'nonEmptyArray'
    | 'null'
    | 'nonNull'
    | 'string'
    | 'nonEmptyString'
    | 'number'
    | 'nonZeroNumber'
    | 'boolean'
    | 'true'
    | 'false'

export type JudgementRule = ValueType | RegExp | Matcher<(target: any) => boolean>

/**
 * 推断配置对象的合法路径。
 * **注意**：类型中不能出现 any，对于未知类型请使用 unknown。
 */
export type Path<T, Key extends keyof T = keyof T> =
    Key extends string
        ?
        Exclude<T[Key], undefined> extends Array<any>
            ?
            `${Key}.${Path<Exclude<T[Key], undefined>, Exclude<keyof Exclude<T[Key], undefined>, keyof Array<any> & string>>}` | Key
            :
            Exclude<T[Key], undefined> extends Record<string, any>
                ?
                `${Key}.${Path<Exclude<T[Key], undefined>>}` | Key
                :
                Key
        :
        never;

/**
 * 根据指定的配置路径推断配置内容。
 */
export type PathValue<T extends Object, P extends Path<T>> =
    P extends `${infer Key}.${infer Rest}`
        ?
        Key extends keyof T
            ?
            Rest extends Path<Exclude<T[Key], undefined>>
                ?
                PathValue<Exclude<T[Key], undefined>, Rest>
                :
                never
            :
            never
        :
        P extends keyof T
            ?
            T[P]
            :
            never;

export type PathValueMap<T> = {
    [P in Path<T>]: PathValue<T, P>
}

export type PathOfType<T, M> = {
    [P in Path<T>]: PathValue<T, P> extends M ? P : never
}[Path<T>]

export type PathValueMapOfType<T, M> = {
    [P in PathOfType<T, M>]: PathValue<T, P>
}

/**
 * 内置字段查询类，提供了路径类型的定义。
 */
export class Reference<T> {

    private _cache: {
        [path: string]: { value: any }
    } = {}

    constructor(public data: T) {
        this._cache[''] = { value: JSON.parse(JSON.stringify(this.data)) }
    }

    get(): T
    get<P extends Path<T>>(path: P): PathValue<T, P> | undefined;
    get<P extends Path<T>>(path: P, def: PathValue<T, P>): Exclude<PathValue<T, P>, undefined> ;
    get<P extends Path<T>>(path?: P, def?: PathValue<T, P>): T | PathValue<T, P> | undefined {
        if (!path) {
            return this._cache[''].value
        }
        if (this._cache[path] === undefined) {
            const paths = path.split('.')
            let data: any = this.data
            for (const p of paths) {
                data = data?.[p]
                if (data === undefined) {
                    break
                }
            }
            const final = data ?? def
            if (final !== undefined) {
                this._cache[path] = { value: JSON.parse(JSON.stringify(data ?? def)) }
            } else {
                this._cache[path] = { value: undefined }
            }
        }
        return this._cache[path].value as any
    }
}

/**
 * 内置对象内容检查。
 */
export class Judgement<T> extends Reference<T> {

    getIf<P extends Path<T>>(prop: P, matcher: 'exist' | 'nonNull'): Exclude<PathValue<T, P>, undefined> | undefined
    getIf<P extends Path<T>>(prop: P, matcher: 'exist' | 'nonNull', def: Exclude<PathValue<T, P>, undefined>): Exclude<PathValue<T, P>, undefined>
    getIf<P extends PathOfType<T, Array<any>>>(prop: P, matcher: 'array' | 'nonEmptyArray'): Exclude<PathValue<T, P>, undefined> | undefined
    getIf<P extends PathOfType<T, Array<any>>>(prop: P, matcher: 'array' | 'nonEmptyArray', def: Exclude<PathValue<T, P>, undefined>): Exclude<PathValue<T, P>, undefined>
    getIf<P extends PathOfType<T, null>>(prop: P, matcher: 'null'): Exclude<PathValue<T, P>, undefined> | undefined
    getIf<P extends PathOfType<T, null>>(prop: P, matcher: 'null', def: Exclude<PathValue<T, P>, undefined>): Exclude<PathValue<T, P>, undefined>
    getIf<P extends PathOfType<T, string>>(prop: P, matcher: 'string' | 'nonEmptyString'): Exclude<PathValue<T, P>, undefined> | undefined
    getIf<P extends PathOfType<T, string>>(prop: P, matcher: 'string' | 'nonEmptyString', def: Exclude<PathValue<T, P>, undefined>): Exclude<PathValue<T, P>, undefined>
    getIf<P extends PathOfType<T, number>>(prop: P, matcher: 'number' | 'nonZeroNumber'): Exclude<PathValue<T, P>, undefined> | undefined
    getIf<P extends PathOfType<T, number>>(prop: P, matcher: 'number' | 'nonZeroNumber', def: Exclude<PathValue<T, P>, undefined>): Exclude<PathValue<T, P>, undefined>
    getIf<P extends PathOfType<T, boolean>>(prop: P, matcher: 'boolean' | 'true' | 'false'): Exclude<PathValue<T, P>, undefined> | undefined
    getIf<P extends PathOfType<T, boolean>>(prop: P, matcher: 'boolean' | 'true' | 'false', def: Exclude<PathValue<T, P>, undefined>): Exclude<PathValue<T, P>, undefined>
    getIf<P extends PathOfType<T, string>>(prop: P, matcher: RegExp): Exclude<PathValue<T, P>, undefined> | undefined
    getIf<P extends PathOfType<T, string>>(prop: P, matcher: RegExp, def: Exclude<PathValue<T, P>, undefined>): Exclude<PathValue<T, P>, undefined>
    getIf<P extends Path<T>>(prop: P, matcher: Matcher<Exclude<PathValue<T, P>, undefined>>): Exclude<PathValue<T, P>, undefined> | undefined
    getIf<P extends Path<T>>(prop: P, matcher: Matcher<Exclude<PathValue<T, P>, undefined>>, def: Exclude<PathValue<T, P>, undefined>): Exclude<PathValue<T, P>, undefined>
    getIf(prop: Path<T>, matcher: JudgementRule, def?: any): any {
        const res = super.get(prop)
        if (res !== undefined && this.if(res, matcher)) {
            return res
        }
        return def
    }

    /**
     * 检查一个字段的值是否匹配指定规则。
     *
     * @param value
     * @param rule
     * @protected
     */
    protected if(value: any, rule?: JudgementRule): any {
        if (rule instanceof RegExp) {
            return typeof value === 'string' && rule.test(value)
        }
        if (rule instanceof Matcher) {
            return rule.check(value)
        }
        switch (rule) {
            case 'exist':
                return value !== undefined
            case 'true':
                return Boolean(value)
            case 'false':
                return !Boolean(value)
            case 'boolean':
                return typeof value === 'boolean'
            case 'object':
                return Object.prototype.toString.call(value) === '[object Object]'
            case 'function':
                return Object.prototype.toString.call(value) === '[object Function]'
            case 'array':
                return Array.isArray(value)
            case 'nonEmptyArray':
                return Array.isArray(value) && value.length
            case 'string':
                return typeof value === 'string'
            case 'nonEmptyString':
                return typeof value === 'string' && value
            case 'number':
                return typeof value === 'number'
            case 'nonZeroNumber':
                return typeof value === 'number' && value
            case 'null':
                return value === null
            case 'nonNull':
                return value !== null
            default:
                return value !== undefined
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
