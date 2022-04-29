/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ChannelWrapper } from '../../amqp'
import { Schedule, ScheduleOptions } from '../../schedule'
import { KeyOfFilterType } from '../../types'
import { Deque } from '../deque'
import { Injector } from '../injector'
import { Meta } from '../meta-tool'
import { Provider, ProviderDef } from '../provider'
import { TokenUtils } from '../token-utils'
import { Assertion, Binding, ConsumeOptions, ProduceOptions } from './amqp'
import ComponentMeta = TokenUtils.ComponentMeta

export type PureJSONArray = Array<PureJSON>

export interface PureJSONObject {
    [prop: string]: PureJSON
}

export type PureJSON = undefined | null | boolean | number | string | PureJSONObject | PureJSONArray

export type Constructor<T extends object> = new(...args: any[]) => T
export type AbstractConstructor<T extends object> = abstract new(...args: any[]) => T

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

export type MetaValue<T> = T extends (target: any, property_key?: string) => Meta<infer P | undefined> ? P : never

interface BaseTpComponentMeta {
    type: `Tp${string}`
    name: string
    provider?: Provider<any>
}

export interface ImportsAndProviders {
    imports?: Array<Constructor<any>>
    providers?: (ProviderDef<any> | Constructor<any>)[]
    producers?: Constructor<any>[]
}

export interface TpModuleOptions extends ImportsAndProviders {

}

export interface TpRootOptions extends ImportsAndProviders {
    routers?: Constructor<any>[]
    tasks?: Constructor<any>[]
    consumers?: Constructor<any>[]
}

export interface TpRouterOptions extends ImportsAndProviders {

}

export interface TpTriggerOptions extends ImportsAndProviders {

}

export interface TpConsumerOptions extends ImportsAndProviders {

}

export interface TpProducerOptions {
    assertions?: Assertion[]
    bindings?: Binding[]
}

export interface TpServiceOptions {
    echo_dependencies?: boolean
}

/**
 * @interface ProviderTreeNode
 */
export interface ProviderTreeNode {
    name: string
    providers: (Provider<any> | undefined)[]
    children: (ProviderTreeNode | undefined)[]
}

interface BaseTpModuleMeta extends BaseTpComponentMeta {
    provider_collector: (injector: Injector) => ProviderTreeNode
}

export interface TpServiceMeta extends BaseTpComponentMeta {
    type: 'TpService'
}

export interface TpModuleMeta extends BaseTpModuleMeta {
    type: 'TpModule'
}

export interface TpRouterMeta extends BaseTpModuleMeta {
    type: 'TpRouter'
    router_path: `/${string}`
    router_options?: TpRouterOptions
    path_replacement: Record<string, string>
    function_collector: () => RouterFunction<any>[]
    on_load: (meta: TpRouterMeta, injector: Injector) => void
}

export interface TpTriggerMeta extends BaseTpModuleMeta {
    type: 'TpTrigger'
    trigger_options?: TpTriggerOptions
    function_collector: () => TriggerFunction<any>[]
    on_load: (meta: TpTriggerMeta, injector: Injector) => void
}

export interface TpProducerMeta extends BaseTpComponentMeta {
    type: 'TpProducer'
    producer_options?: TpProducerOptions
    function_collector: () => ProducerFunction<any>[]
    on_load: (meta: TpProducerMeta, injector: Injector) => void
}

export interface TpConsumerMeta extends BaseTpModuleMeta {
    type: 'TpConsumer'
    producer_options?: TpConsumerOptions
    function_collector: () => ConsumerFunction<any>[]
    on_load: (meta: TpConsumerMeta, injector: Injector) => void
}

export interface TpRootMeta extends BaseTpModuleMeta {
    type: 'TpRoot'
    routers?: Constructor<any>[]
    tasks?: Constructor<any>[]
    consumers?: Constructor<any>[]
    producers?: Constructor<any>[]
    on_load: (meta: TpRootMeta, injector: Injector) => void
}

export type TpModuleMetaLike =
    | TpModuleMeta
    | TpRouterMeta
    | TpTriggerMeta
    | TpConsumerMeta
    | TpRootMeta

export type TpFunctionalComponent =
    | TpRouterMeta
    | TpTriggerMeta
    | TpProducerMeta
    | TpConsumerMeta

export type ComponentMeta =
    | TpServiceMeta
    | TpProducerMeta
    | TpModuleMetaLike

export type ReflectComponent<K extends ComponentMeta['type'], T extends ComponentMeta = ComponentMeta> = T extends { type: K } ? T : never

export interface ClassMeta {
    on_destroy?: TypedPropertyDescriptor<any>
    parameter_injection: any[]
}

export interface PropertyMeta {
    disabled?: boolean
    worker?: { channel: string }
    parameter_injection: any[]
}

export interface BasePropertyFunction<T extends (...args: any) => any> {
    type: `Tp${string}Function`
    prototype: any
    property: string
    descriptor: TypedPropertyDescriptor<T>
    handler: T
    param_types?: Parameters<T>
    pos?: string
    meta?: PropertyMeta
}

export interface RouterFunction<T extends (...args: any) => any> extends BasePropertyFunction<T> {
    type: 'TpRouterFunction'
    path: string
    GET?: boolean
    POST?: boolean
    PUT?: boolean
    DELETE?: boolean
    auth: boolean
    wrap_result: boolean
    cache_prefix?: string
    cache_expires?: number
}

export interface TriggerFunction<T extends (...args: any) => any> extends BasePropertyFunction<T> {
    type: 'TpTriggerFunction'
    crontab?: string
    schedule?: Schedule
    schedule_options?: ScheduleOptions
    name?: string
    lock_key?: string
    lock_expires?: number
}

export interface ConsumerFunction<T extends (...args: any) => any> extends BasePropertyFunction<T> {
    type: 'TpConsumerFunction'
    consumerTag?: string
    consume?: { queue: string, options: ConsumeOptions }
    channel_wrapper?: ChannelWrapper
    channel_error?: any
}

export interface ProducerFunction<T extends (...args: any) => any> extends BasePropertyFunction<T> {
    type: 'TpProducerFunction'
    produce?: { exchange: string, routing_key: string, options: ProduceOptions }
    produce_cache: Deque<[message: any, produce_options: ProduceOptions | undefined, resolve: (data: any) => void, reject: (err: any) => void]>
    channel_wrapper?: ChannelWrapper
    channel_error?: any
}

export type PropertyFunction<T extends (...args: any) => any> =
    | RouterFunction<T>
    | TriggerFunction<T>
    | ConsumerFunction<T>
    | ProducerFunction<T>
