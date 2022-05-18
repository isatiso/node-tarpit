/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Constructor, KeyOfFilterType } from './base'

export type DecoratorClass<STATIC extends object = any> = <CLASS extends object>(constructor: Constructor<CLASS> & STATIC) => Constructor<CLASS> & STATIC | void

export type DecoratorInstanceMethod<T extends (...args: any[]) => any = (...args: any[]) => any>
    = <VALUE_TYPE, CLASS extends object>(prototype: CLASS, prop: string, descriptor: TypedPropertyDescriptor<T extends VALUE_TYPE ? VALUE_TYPE : never>) => TypedPropertyDescriptor<VALUE_TYPE> | void

export type DecoratorStaticMethod<T extends (...args: any[]) => any = (...args: any[]) => any>
    = <VALUE_TYPE, CLASS extends object>(constructor: Constructor<CLASS>, prop: string, descriptor: TypedPropertyDescriptor<T extends VALUE_TYPE ? VALUE_TYPE : never>) => TypedPropertyDescriptor<VALUE_TYPE> | void

export type DecoratorInstanceAccessor = <VALUE_TYPE, CLASS extends object>(prototype: CLASS, prop: string, descriptor: TypedPropertyDescriptor<VALUE_TYPE>) => TypedPropertyDescriptor<VALUE_TYPE> | void
export type DecoratorStaticAccessor = <VALUE_TYPE, CLASS extends object>(constructor: Constructor<CLASS>, prop: string, descriptor: TypedPropertyDescriptor<VALUE_TYPE>) => TypedPropertyDescriptor<VALUE_TYPE> | void

export type DecoratorInstanceProperty<FILTER = any> = <CLASS extends object, K extends KeyOfFilterType<CLASS, FILTER> & string>(prototype: CLASS, prop: K) => void
export type DecoratorStaticProperty = <CLASS extends object>(constructor: Constructor<CLASS>, prop: string) => void

export type DecoratorParameter = <CLASS extends object>(target: Constructor<CLASS> | CLASS, prop: string | undefined, index: number) => void
