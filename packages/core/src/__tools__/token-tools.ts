/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

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
    export const Dependencies = MetaWrapper<{ [property: string | symbol]: any[] }>(DI_TOKEN.dependencies, 'both', () => ({}))

    /**
     * 存储实例。
     * @category Basic Meta
     */
    export const Instance = MetaWrapper<any>(DI_TOKEN.instance, 'prototype_only')

    export function ensure_component(module: Function): { [K in keyof TpComponentCollector]: Meta<TpComponentCollector[K]> }[keyof TpComponentCollector] {
        const meta = TokenTools.ComponentMeta(module.prototype)
        const meta_value = meta.value
        if (!meta_value) {
            throw new Error(`ComponentMeta of ${module.name ?? module.prototype?.toString()} is empty.`)
        }
        return meta as Meta<any>
    }

    export function ensure_component_is<K extends keyof TpComponentCollector>(
        module: Function,
        type: K,
        msg?: (meta_value: BaseTpComponentMeta<any> | undefined, module: Function) => string | undefined
    ): Meta<TpComponentCollector[K]> {
        const meta = ensure_component(module.prototype)
        if (type !== meta.value.type) {
            throw new Error(msg?.(meta.value, module) ?? `${meta.value.name} is "${meta.value.type}" which should be a ${type}.`)
        }
        return meta as Meta<any>
    }
}
