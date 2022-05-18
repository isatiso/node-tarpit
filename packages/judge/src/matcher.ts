/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

/**
 * 提供针对 Judgement 的检查工具
 */
export class Matcher<T> {
    constructor(public check: (target: any) => boolean) {
    }
}

/**
 * 预设的 Matcher
 */
export namespace Jtl {

    export function greater_than(value: number): Matcher<number> {
        return new Matcher((target: any) => typeof target === 'number' && target > value)
    }

    export function greater_than_or_equal(value: number): Matcher<number> {
        return new Matcher((target: any) => typeof target === 'number' && target >= value)
    }

    export function less_than(value: number): Matcher<number> {
        return new Matcher((target: any) => typeof target === 'number' && target < value)
    }

    export function less_than_or_equal(value: number): Matcher<number> {
        return new Matcher((target: any) => typeof target === 'number' && target <= value)
    }

    export function equal(value: number): Matcher<number> {
        return new Matcher((target: any) => typeof target === 'number' && target === value)
    }

    export function not_equal(value: number): Matcher<number> {
        return new Matcher((target: any) => typeof target === 'number' && target !== value)
    }

    export function between(start: number, end: number): Matcher<number> {
        return new Matcher((target: any) => typeof target === 'number' && start <= target && target <= end)
    }

    export function be_included_with(arr: number[]): Matcher<number> {
        return new Matcher((target: any) => typeof target === 'number' && arr.includes(target))
    }

    export function multiple_of(factor: number): Matcher<number> {
        return new Matcher((target: any) => typeof target === 'number' && target % factor === 0)
    }

    export const $mx = multiple_of
    export const $btw = between
    export const $in = be_included_with
    export const $gt = greater_than
    export const $ge = greater_than_or_equal
    export const $lt = less_than
    export const $le = less_than_or_equal
    export const $eq = equal
    export const $ne = not_equal

    export const exist = new Matcher<any>((target: any) => target !== undefined)
    export const isFunction = new Matcher<Function>((target: any) => Object.prototype.toString.call(target) === '[object Function]')
    export const object = new Matcher<object>((target: any) => Object.prototype.toString.call(target) === '[object Object]')
    export const array = new Matcher<Array<any>>((target: any) => Array.isArray(target))
    export const nonEmptyArray = new Matcher<Array<any>>((target: any) => Array.isArray(target) && target.length !== 0)

    export const isNull = new Matcher<string>((target: any) => target === null)
    export const string = new Matcher<string>((target: any) => typeof target === 'string')
    export const nonEmptyString = new Matcher<string>((target: any) => typeof target === 'string' && target !== '')
    export const number = new Matcher<number>((target: any) => typeof target === 'number')
    export const nonZeroNumber = new Matcher<number>((target: any) => typeof target === 'number' && target !== 0)
    export const boolean = new Matcher<boolean>((target: any) => typeof target === 'boolean')
    export const isTrue = new Matcher<boolean>((target: any) => target === true)
    export const isFalse = new Matcher<boolean>((target: any) => target === false)
}
