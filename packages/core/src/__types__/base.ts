/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type Constructor<T extends object> = new(...args: any[]) => T

export type AbstractConstructor<T extends object> = abstract new(...args: any[]) => T

export type KeyOfFilterType<T, U> = {
    [K in keyof T]: Exclude<T[K], undefined> extends U ? K : never
}[keyof T]

export type PureJSON = null | boolean | number | string | { [prop: string]: PureJSON } | Array<PureJSON>
