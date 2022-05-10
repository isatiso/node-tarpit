/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Constructor } from '../__types__'
import { BaseTpComponentMeta, FunctionRecord, TpComponentCollector, TpComponentMeta } from './component-types'
import { Meta, MetaWrapper } from './meta'
import { DI_TOKEN } from './token'

/**
 * Reflect Metadata 工具集。
 *
 * @category Namespace
 */
export namespace TokenTools {

    /**
     * Tp Component 元数据。
     * @category Basic Meta
     */
    export const ComponentMeta = MetaWrapper<TpComponentMeta>(DI_TOKEN.component_meta, 'prototype_only')

    /**
     * 自定义数据。
     * @category Basic Meta
     */
    export const FunctionRecord = MetaWrapper<FunctionRecord>(DI_TOKEN.function_record, 'prototype_only', () => ({}))

    /**
     * 参数类型。
     * @category Basic Meta
     */
    export const Dependencies = MetaWrapper<{ [property: string]: any[] }>(DI_TOKEN.dependencies, 'both', () => ({}))

    /**
     * 存储实例。
     * @category Basic Meta
     */
    export const Instance = MetaWrapper<any>(DI_TOKEN.instance, 'prototype_only')

    export function ensure_component(module: Constructor<any>): { [K in keyof TpComponentCollector]: Meta<TpComponentCollector[K]> }[keyof TpComponentCollector] {
        const meta = TokenTools.ComponentMeta(module.prototype)
        const meta_value = meta.value
        if (!meta_value) {
            throw new Error(`ComponentMeta of ${module.name ?? module.prototype?.toString()} is empty.`)
        }
        return meta as Meta<any>
    }

    export function ensure_component_is<K extends keyof TpComponentCollector>(
        module: Constructor<any>,
        type: K,
        msg?: (meta_value: BaseTpComponentMeta<any> | undefined, module: Constructor<any>) => string | undefined
    ): Meta<TpComponentCollector[K]> {
        const meta = ensure_component(module.prototype)
        if (type !== meta.value.type) {
            throw new Error(msg?.(meta.value, module) ?? `${meta.value.name} is "${meta.value.type}" which should be a ${type}.`)
        }
        return meta as Meta<any>
    }
}
