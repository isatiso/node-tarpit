/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Constructor, DecoratorClass, DecoratorInstanceMethod, RouterFunction, TokenUtils } from '../core'

/**
 * 一些用于开发自定义装饰器的工具函数。
 *
 * @category Namespace
 */
export namespace AnnotationTools {

    /**
     * @deprecated use create_class_decorator
     */
    export const create_decorator = create_class_decorator

    /**
     * 用于创建自定义装饰器。
     *
     * [[include:di/create-decorator.md]]
     *
     * @param processor 自定义装饰器的处理函数。
     * @return decorator 新的装饰器。
     */
    export function create_class_decorator<T, STATIC extends object = any>(
        processor: <CLASS extends object>(constructor: Constructor<CLASS> & STATIC, meta: any, options?: T) => void
    ) {
        return function(options?: T): DecoratorClass<STATIC> {
            return constructor => {
                TokenUtils.CustomData(constructor.prototype).ensure_default({})
                    .do(meta => {
                        processor(constructor, meta, options)
                    })
            }
        }
    }

    /**
     * 用于创建自定义装饰器。
     *
     * [[include:di/create-decorator.md]]
     *
     * @param processor 自定义装饰器的处理函数。
     * @return decorator 新的装饰器。
     */
    export function create_method_decorator<T>(
        processor: <VALUE_TYPE extends (...args: any[]) => any, CLASS extends object>(prototype: CLASS, prop: string, descriptor: TypedPropertyDescriptor<VALUE_TYPE>, meta: any, options?: T) => void
    ) {
        return function(options?: T): DecoratorInstanceMethod {
            return (prototype, prop, descriptor) => {
                TokenUtils.CustomData(prototype).ensure_default({})
                    .do(meta => {
                        processor(prototype, prop, descriptor as any, meta, options)
                    })
            }
        }
    }

    /**
     * 获取成员函数参数的类型列表。
     *
     * [[include:di/get-param-types.md]]
     *
     * @param proto Tp 组件类的原型。
     * @param property_key 成员函数名。
     * @return type_list 类型列表。
     */
    export function get_param_types(proto: any, property_key: string) {
        const inject_token_map = TokenUtils.PropertyMeta(proto, property_key).value?.parameter_injection
        return TokenUtils.get_method_parameter_types(proto, property_key)?.map((t: any, i: number) => inject_token_map?.[i] ?? t)
    }

    /**
     * 通过处理函数描述对象 `HandlerDescriptor` 创建监听函数。
     *
     * 使用方式参考 [[AnnotationTools.add_handler]]
     *
     * @param proto
     * @param desc 处理函数描述对象
     * @return
     */
    export function add_handler(proto: any, desc: RouterFunction<any>): void {
        TokenUtils.Touched(proto).ensure_default()
            .do(touched => {
                if (touched[desc.property]) {
                    console.log(`Warning: ${desc.property} have been touched with ${desc.type}.`)
                }
                touched[desc.property] = desc
            })
    }

    /**
     * 查询自定义数据。
     * 自定义数据是一个挂在目标 Class 原型上的一个对象，可以通过 index_key 获取对应内容。
     *
     * @param prototype Tp 组件类原型
     * @param index_key 内容索引
     * @return data 查询结果
     */
    export function get_custom_data<T>(prototype: any, index_key: string): T | undefined {
        return TokenUtils.CustomData(prototype).value?.[index_key]
    }

    /**
     * 添加自定义数据。
     * 自定义数据是一个挂在目标 Class 原型上的一个对象，可以通过 index_key 获取对应内容。
     *
     * @param prototype Tp 组件类原型
     * @param index_key 内容索引
     * @param data 需要设置的内容
     * @return
     */
    export function define_custom_data<T = any>(prototype: any, index_key: string, data: T) {
        TokenUtils.CustomData(prototype).ensure_default().do(custom_data => custom_data[index_key] = data)
    }
}
