/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import 'reflect-metadata'
import { ClassMeta, PluginMeta, PropertyMeta } from '../__types__'
import { TpAssemblyCollection, TpComponentCollection, TpComponentCommon, TpComponentLike, TpUnitRecord, TpWorkerCollection } from '../tp-component-type'
import { DI_TOKEN, TpMeta, TpMetaWrapper } from './tp-meta'

/**
 * Reflect Metadata 工具集。
 *
 * @category Namespace
 */
export namespace MetaTools {

    export const ComponentMeta = TpMetaWrapper<TpComponentLike>(DI_TOKEN.component_meta, 'prototype_only')
    export const UnitRecord = TpMetaWrapper<TpUnitRecord>(DI_TOKEN.unit_record, 'prototype_only', () => new Map())
    export const Dependencies = TpMetaWrapper<Map<string | symbol, any[]>>(DI_TOKEN.dependencies, 'both', () => new Map())
    export const Instance = TpMetaWrapper<any>(DI_TOKEN.instance, 'prototype_only')
    export const ClassMeta = TpMetaWrapper<ClassMeta>(DI_TOKEN.class_meta, 'prototype_only', () => ({ parameter_injection: [], loader: '', type: '' }))
    export const PropertyMeta = TpMetaWrapper<PropertyMeta>(DI_TOKEN.property_meta, 'property_only', () => ({ parameter_injection: [] }))
    export const CustomData = TpMetaWrapper<Map<string | symbol, any>>(DI_TOKEN.custom_data, 'prototype_only', () => new Map())
    export const PluginMeta = TpMetaWrapper<PluginMeta>(DI_TOKEN.plugin_meta, 'prototype_only', () => ({ loader_list: [], type: '', option_key: '' }))

    export function ensure_component(module: Function): { [K in keyof TpComponentCollection]: TpMeta<TpComponentCollection[K]> }[keyof TpComponentCollection] {
        const meta = MetaTools.ComponentMeta(module.prototype)
        const meta_value = meta?.value
        if (!meta_value) {
            throw new Error(`ComponentMeta of ${module.name ?? module.prototype?.toString()} is empty.`)
        }
        return meta as TpMeta<any>
    }

    export function ensure_assembly(
        module: Function,
        msg?: (meta_value: TpComponentCommon<any> | undefined, module: Function) => string | undefined
    ): { [K in keyof TpAssemblyCollection]: TpMeta<TpAssemblyCollection[K]> }[keyof TpAssemblyCollection] {
        const meta = ensure_component(module)
        if (meta.value.category !== 'assembly') {
            throw new Error(msg?.(meta.value, module) ?? `${meta.value.name} is "${meta.value.type}" which should be a "TpAssemblyLike".`)
        }
        return meta as TpMeta<any>
    }

    export function ensure_worker(
        module: Function,
        msg?: (meta_value: TpComponentCommon<any> | undefined, module: Function) => string | undefined
    ): { [K in keyof TpWorkerCollection]: TpMeta<TpWorkerCollection[K]> }[keyof TpWorkerCollection] {
        const meta = ensure_component(module)
        if (meta.value.category !== 'worker') {
            throw new Error(msg?.(meta.value, module) ?? `${meta.value.name} is "${meta.value.type}" which should be a "TpWorkerLike".`)
        }
        return meta as TpMeta<any>
    }

    export function ensure_component_is<K extends keyof TpComponentCollection>(
        module: Function,
        type: K,
        msg?: (meta_value: TpComponentCommon<any> | undefined, module: Function) => string | undefined
    ): TpMeta<TpComponentCollection[K]> {
        const meta = ensure_component(module)
        if (type !== meta.value.type) {
            throw new Error(msg?.(meta.value, module) ?? `${meta.value.name} is "${meta.value.type}" which should be a ${type}.`)
        }
        return meta as TpMeta<any>
    }

    export function get_constructor_parameter_types(constructor: Function): any[] {
        return Reflect.getMetadata('design:paramtypes', constructor)
    }

    export function get_method_parameter_types(proto: any, prop: string | symbol): any[] {
        return Reflect.getMetadata('design:paramtypes', proto, prop)
    }

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
