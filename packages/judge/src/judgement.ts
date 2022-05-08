/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { JudgementUtil } from './judgement-utils'

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

export type JudgementMatcher = ValueType | RegExp | JudgementUtil<(...args: any[]) => boolean>

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

    /**
     * 检查一个字段的值是否匹配指定规则。
     *
     * @param value
     * @param type
     * @protected
     */
    protected testValue(value: any, type?: JudgementMatcher): any {
        if (type instanceof RegExp) {
            return typeof value === 'string' && type.test(value)
        }
        if (type instanceof JudgementUtil) {
            return type.check(value)
        }
        switch (type) {
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
     * @param types
     * @protected
     */
    protected any(value: any, types: JudgementMatcher[]) {
        for (const type of types) {
            if (this.testValue(value, type)) {
                return true
            }
        }
        return false
    }

    /**
     * 检查一个字段的值是否匹配全部指定规则。
     *
     * @param value
     * @param types
     * @protected
     */
    protected all(value: any, types: JudgementMatcher[]) {
        for (const type of types) {
            if (!this.testValue(value, type)) {
                return false
            }
        }
        return true
    }
}
