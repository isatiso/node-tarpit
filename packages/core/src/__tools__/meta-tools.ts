/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ClassMeta, PluginMeta, PropertyMeta } from '../__types__'
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
    export const CustomData = MetaWrapper<{ [prop: string | symbol]: any }>(DI_TOKEN.custom_data, 'prototype_only', () => ({}))

    /**
     * 自定义数据。
     * @category Basic Meta
     */
    export const PluginMeta = MetaWrapper<PluginMeta>(DI_TOKEN.plugin_meta, 'prototype_only', () => ({ loader_list: [], type: '', option_key: '' }))

    /**
     * 获取指定类或函数的参数列表。
     *
     * @category Reflect Metadata
     * @param constructor
     */
    export function get_constructor_parameter_types(constructor: Function): any[] {
        return Reflect.getMetadata('design:paramtypes', constructor)
    }

    export function get_method_parameter_types(proto: any, prop: string | symbol): any[] {
        return Reflect.getMetadata('design:paramtypes', proto, prop)
    }

    /**
     * 获取指定目标的类型。
     *
     * @category Reflect Metadata
     * @param proto
     * @param prop
     */
    export function get_property_type(proto: any, prop: string | symbol): any {
        return Reflect.getMetadata('design:type', proto, prop)
    }

    export function check_property(prototype: any, property?: string | symbol): [PropertyDescriptor, string | symbol] {
        if (!property) {
            throw new Error('Function Decorator can not place on class.')
        }
        const descriptor = Object.getOwnPropertyDescriptor(prototype, property)
        if (!descriptor) {
            throw new Error(`Descriptor of specified property "${property.toString()}" is empty.`)
        }
        return [descriptor, property]
    }
}
