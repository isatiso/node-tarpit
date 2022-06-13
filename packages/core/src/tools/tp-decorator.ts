/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import 'reflect-metadata'
import { Constructor, Provider } from '../types'
import { stringify } from './stringify'

const Class_Decorator = Symbol.for('œœ.decorator.class')
const Property_Decorator = Symbol.for('œœ.decorator.property')
const Parameter_Decorator = Symbol.for('œœ.decorator.parameter')
const Method_Parameter_Decorator = Symbol.for('œœ.decorator.method_parameter')

export type MixDecorator = (target: any, prop?: string | symbol, desc?: number | PropertyDescriptor) => any

export type AbstractDecoratorFactory<T> = abstract new(...args: any[]) => T

export interface DecoratorFactory<ARGS extends any[], T> {
    new(...args: ARGS): T

    (...args: ARGS): MixDecorator
}

export type DecoratorInnerField = { cls: Constructor<any>, prop?: string | symbol, index?: number, provider?: Provider<any> }

function make_metadata_ctor(props: (...args: any[]) => any): any {
    return function ctor(this: any, ...args: any[]) {
        const values = props(...args)
        for (const propName in values) {
            this[propName] = values[propName]
        }
    }
}

export function make_abstract_decorator<R>(
    name: string,
    parent_class?: abstract new (...args: any[]) => any
): AbstractDecoratorFactory<R & DecoratorInnerField> {

    function DecoratorFactory(this: unknown | typeof DecoratorFactory) {
        throw new Error(`Abstract decorator can't be called directly`)
    }

    if (parent_class) {
        DecoratorFactory.prototype = Object.create(parent_class.prototype)
    }

    Reflect.defineProperty(DecoratorFactory, 'name', { configurable: false, writable: false, value: name })
    DecoratorFactory.prototype.constructor = DecoratorFactory
    return DecoratorFactory as any
}

export function make_decorator<ARGS extends any[], T, PR>(
    name: string,
    props: (...args: ARGS) => T & Omit<PR, keyof DecoratorInnerField>,
    parent_class?: abstract new (...args: any) => PR
): DecoratorFactory<ARGS, T & PR & DecoratorInnerField> {

    const meta_ctor = make_metadata_ctor(props)

    function DecoratorFactory(this: unknown | typeof DecoratorFactory, ...args: any[]) {
        if (this instanceof DecoratorFactory) {
            meta_ctor.apply(this, args)
            return this
        }
        const decorator_instance = new (<any> DecoratorFactory)(...args)

        function decorator(target: any, prop?: string | symbol, desc?: number | PropertyDescriptor): any {
            const is_constructor = target && target.prototype?.constructor === target
            const is_parameter = typeof desc === 'number'

            if (is_constructor) {
                decorator_instance.cls = target
                /* istanbul ignore next */
                if (!prop) {
                    if (is_parameter) {
                        // DecoratorType.ClassParameter
                        const index = decorator_instance.index = desc
                        const parameters = target[Parameter_Decorator] = target[Parameter_Decorator] ?? []
                        while (parameters.length <= index) {
                            parameters.push(null)
                        }
                        parameters[index] = parameters[index] ?? []
                        parameters[index].push(decorator_instance)
                    } else {
                        // DecoratorType.Class
                        const decorators = target[Class_Decorator] = target[Class_Decorator] ?? []
                        decorators.push(decorator_instance)
                    }
                }
            } else {
                const cls = target.constructor
                decorator_instance.cls = cls

                /* istanbul ignore next */
                if (prop) {
                    decorator_instance.prop = prop
                    if (is_parameter) {
                        // DecoratorType.Parameter
                        const index = decorator_instance.prop = desc
                        const meta = cls[Method_Parameter_Decorator] = cls[Method_Parameter_Decorator] ?? {}
                        const parameters = meta[prop] = meta[prop] ?? []
                        while (parameters.length <= index) {
                            parameters.push(null)
                        }
                        parameters[index] = parameters[index] ?? []
                        parameters[index].push(decorator_instance)
                    } else {
                        // DecoratorType.Property
                        const meta: Map<any, any[]> = cls[Property_Decorator] = cls[Property_Decorator] ?? new Map()
                        meta.has(prop) || meta.set(prop, [])
                        meta.get(prop)!.push(decorator_instance)
                    }
                }
            }
        }

        decorator.annotation = decorator_instance
        return decorator
    }

    if (parent_class) {
        DecoratorFactory.prototype = Object.create(parent_class.prototype)
    }

    Reflect.defineProperty(DecoratorFactory, 'name', { configurable: false, writable: false, value: name })
    DecoratorFactory.prototype.constructor = DecoratorFactory
    return DecoratorFactory as any
}

export function get_class_decorator<T>(target: any): any[] {
    if (target.prototype?.constructor !== target) {
        throw new Error(`${stringify(target)} is not constructor.`)
    }
    return target[Class_Decorator] ?? []
}

export function get_class_parameter_decorator<T>(target: any): any[] {
    if (target.prototype?.constructor !== target) {
        throw new Error(`${stringify(target)} is not constructor.`)
    }
    return target[Parameter_Decorator] ?? []
}

export function get_all_prop_decorator<T>(target: any): Map<string | symbol, any[]> | undefined {
    if (target.prototype?.constructor !== target) {
        throw new Error(`${stringify(target)} is not constructor.`)
    }
    return target[Property_Decorator]
}

export function get_prop_decorator<T>(target: any, prop: string | symbol): any[] {
    if (target.prototype?.constructor !== target) {
        throw new Error(`${stringify(target)} is not constructor.`)
    }
    return target[Property_Decorator]?.get(prop) ?? []
}

export function get_method_parameter_decorator<T>(target: any, prop: string | symbol): any[] {
    if (target.prototype?.constructor !== target) {
        throw new Error(`${stringify(target)} is not constructor.`)
    }
    return target[Method_Parameter_Decorator]?.[prop] ?? []
}

export function get_param_types(cls: Constructor<any>, prop?: string | symbol) {
    const target = prop === undefined ? cls : cls.prototype
    return Reflect.getMetadata('design:paramtypes', target, prop as any)
}

export function get_prop_types(cls: Constructor<any>, prop: string | symbol) {
    const target = cls.prototype
    return Reflect.getMetadata('design:type', target, prop)
}
