/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

export type PureJSON = null | boolean | number | string | { [prop: string]: PureJSON } | Array<PureJSON>
export type Constructor<T extends object> = new(...args: any[]) => T
export type AbstractConstructor<T extends object> = abstract new(...args: any[]) => T
export type KeyOfFilterType<T, U> = { [K in keyof T]: Exclude<T[K], undefined> extends U ? K : never }[keyof T]
