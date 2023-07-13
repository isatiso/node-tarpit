/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */


export type MismatchDescription = {
    rule: string,
}

export type JudgementRule = RegExp | Matcher<any>
export type MatcherInferType<T extends Matcher<any> | RegExp> = T extends RegExp ? string : T extends Matcher<infer V> ? V : never

export class Matcher<ReturnType> {

    constructor(
        public rule: string,
        private check: (target: any) => boolean
    ) {
    }

    static if(value: any, rule: JudgementRule): boolean {
        if (rule instanceof RegExp) {
            return typeof value === 'string' && rule.test(value)
        } else {
            return !rule.mismatch(value)
        }
    }

    static mismatch(value: any, rule: JudgementRule): undefined | MismatchDescription {
        if (rule instanceof RegExp) {
            if (typeof value !== 'string' || !rule.test(value)) {
                return { rule: `RegExp ${rule.source}` }
            } else {
                return undefined
            }
        } else {
            return rule.mismatch(value)
        }
    }

    mismatch(target: any): MismatchDescription | undefined {
        if (this.check(target)) {
            return
        } else {
            return { rule: this.rule, }
        }
    }
}

function get_rule(r: JudgementRule) {
    return r instanceof Matcher ? r.rule : `RegExp ${r.source}`
}

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

export namespace Jtl {

    export function some<T extends (Matcher<T> | RegExp)[]>(...rules: T): Matcher<MatcherInferType<T[number]>> {
        return new Matcher(`match at least one rule of [${rules.map(r => `"${get_rule(r)}"`).join('|')}]`,
            (target: any) => rules.some(rule => !Matcher.mismatch(target, rule)))
    }

    export function every<T extends (Matcher<T> | RegExp)[]>(...rules: T): Matcher<UnionToIntersection<MatcherInferType<T[number]>>> {
        return new Matcher(`match every rule of [${rules.map(r => `"${get_rule(r)}"`).join('|')}]`,
            (target: any) => rules.every(rule => !Matcher.mismatch(target, rule)))
    }

    export const $gt = greater_than

    export function greater_than(value: number): Matcher<number> {
        return new Matcher(`greater than ${value}`, (target: any) => typeof target === 'number' && target > value)
    }

    export const $ge = greater_than_or_equal

    export function greater_than_or_equal(value: number): Matcher<number> {
        return new Matcher(`greater than or equal ${value}`, (target: any) => typeof target === 'number' && target >= value)
    }

    export const $lt = less_than

    export function less_than(value: number): Matcher<number> {
        return new Matcher(`less than ${value}`, (target: any) => typeof target === 'number' && target < value)
    }

    export const $le = less_than_or_equal

    export function less_than_or_equal(value: number): Matcher<number> {
        return new Matcher(`less than or equal ${value}`, (target: any) => typeof target === 'number' && target <= value)
    }

    export const $eq = equal

    export function equal(value: number): Matcher<number> {
        return new Matcher(`equal ${value}`, (target: any) => typeof target === 'number' && target === value)
    }

    export const $ne = not_equal

    export function not_equal(value: number): Matcher<number> {
        return new Matcher(`not equal ${value}`, (target: any) => typeof target === 'number' && target !== value)
    }

    export const $btw = between

    export function between(start: number, end: number): Matcher<number> {
        return new Matcher(`between ${start} and ${end}`, (target: any) => typeof target === 'number' && start <= target && target <= end)
    }

    export const $in = be_included_with

    export function be_included_with(arr: number[]): Matcher<number> {
        return new Matcher(`be included with [${arr.toString()}]`, (target: any) => typeof target === 'number' && arr.includes(target))
    }

    export const $mx = multiple_of

    export function multiple_of(factor: number): Matcher<number> {
        return new Matcher(`be multiple of factor ${factor}`, (target: any) => typeof target === 'number' && target % factor === 0)
    }

    export function array_of<T extends Matcher<T> | RegExp>(matcher: T): Matcher<MatcherInferType<T>[]> {
        return new Matcher(`an array containing elements of [${get_rule(matcher)}]`,
            (target: any) => target.every((item: any) => !Matcher.mismatch(item, matcher)))
    }

    export function property<P extends string, T extends Matcher<T> | RegExp>(prop: P, matcher: T): Matcher<{ [key in P]: MatcherInferType<T> }> {
        return new Matcher(`has property "${prop}" of [${get_rule(matcher)}]`,
            (target: any) => target[prop] !== undefined && !Matcher.mismatch(target[prop], matcher))
    }

    export const exist = new Matcher<any>(`not equal to undefined`, (target: any) => target !== undefined)
    export const is_function = new Matcher<Function>(`is function`, (target: any) => Object.prototype.toString.call(target) === '[object Function]')
    export const object = new Matcher<object>(`is object`, (target: any) => Object.prototype.toString.call(target) === '[object Object]')
    export const array = new Matcher<Array<any>>(`is array`, (target: any) => Array.isArray(target))
    export const non_empty_array = new Matcher<Array<any>>(`is non-empty array`, (target: any) => Array.isArray(target) && target.length !== 0)

    export const is_null = new Matcher<null>(`is null`, (target: any) => target === null)
    export const is_void = new Matcher<undefined>(`is void`, (target: any) => target === undefined)
    export const string = new Matcher<string>(`is string`, (target: any) => typeof target === 'string')
    export const non_empty_string = new Matcher<string>(`is non-empty string`, (target: any) => typeof target === 'string' && target !== '')
    export const number = new Matcher<number>(`is number`, (target: any) => typeof target === 'number')
    export const non_zero_number = new Matcher<number>(`is non-zero number`, (target: any) => typeof target === 'number' && target !== 0)
    export const boolean = new Matcher<boolean>(`is boolean`, (target: any) => typeof target === 'boolean')
    export const is_true = new Matcher<boolean>(`is true`, (target: any) => target === true)
    export const is_false = new Matcher<boolean>(`is false`, (target: any) => target === false)
}
