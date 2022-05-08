/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ClassMeta, Constructor, PluginMeta, PropertyMeta } from '../__types__'
import { MetaWrapper } from './meta'
import { DI_TOKEN } from './token'

export namespace MetaTools {

    /**
     * 自定义数据。
     * @category Basic Meta
     */
    export const ClassMeta = MetaWrapper<ClassMeta>(DI_TOKEN.class_meta, 'prototype_only', () => ({ parameter_injection: [], loader: '', type: '' }))

    /**
     * 自定义数据。
     * @category Basic Meta
     */
    export const PropertyMeta = MetaWrapper<PropertyMeta>(DI_TOKEN.property_meta, 'property_only', () => ({ parameter_injection: [] }))

    /**
     * 自定义数据。
     * @category Basic Meta
     */
    export const CustomData = MetaWrapper<{ [prop: string]: any }>(DI_TOKEN.custom_data, 'prototype_only', () => ({}))

    /**
     * 自定义数据。
     * @category Basic Meta
     */
    export const PluginMeta = MetaWrapper<PluginMeta>(DI_TOKEN.class_meta, 'prototype_only', () => ({ loader: '', type: '', option_key: '' }))

    /**
     * 获取指定类或函数的参数列表。
     *
     * @category Reflect Metadata
     * @param constructor
     */
    export function get_constructor_parameter_types(constructor: Constructor<any>): any[] {
        return Reflect.getMetadata('design:paramtypes', constructor)
    }

    export function get_method_parameter_types(proto: any, prop: string): any[] {
        return Reflect.getMetadata('design:paramtypes', proto, prop)
    }

    /**
     * 获取指定目标的类型。
     *
     * @category Reflect Metadata
     * @param proto
     * @param prop
     */
    export function get_property_type(proto: any, prop: string): any {
        return Reflect.getMetadata('design:type', proto, prop)
    }

    export function check_property(prototype: any, property?: string): [PropertyDescriptor, string] {
        if (!property) {
            throw new Error('Function Decorator can not place on class.')
        }
        const descriptor = Object.getOwnPropertyDescriptor(prototype, property)
        if (!descriptor) {
            throw new Error(`Descriptor of specified property "${property}" is empty.`)
        }
        return [descriptor, property]
    }
}
