/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import EventEmitter from 'events'
import { TpEvent } from '../../types'
import { AbstractConstructor } from '../annotation'
import { Provider } from '../provider'
import { InjectorProvider } from './injector-provider'
import { _NullInjector, NullInjector } from './null-injector'

/**
 * @private
 *
 * 注入器，用于查找依赖。
 *
 * @category Injector
 */
export class Injector {

    readonly children: Injector[] = []

    constructor(
        public parent: Injector | _NullInjector,
        public providers: Map<any, Provider<any>> = new Map(),
        public readonly emitter: EventEmitter,
    ) {
    }

    /**
     * 从父注入器创建一个新的注入器。
     *
     * @param parent 父注入器
     * @param providers 默认的 Provider
     */
    static create(parent?: Injector | null, providers?: Map<any, Provider<any>>): Injector {
        providers = new Map(providers?.entries() ?? [])

        const real_parent = parent ?? NullInjector as unknown as Injector
        const parent_emitter = real_parent.emitter ?? new EventEmitter().setMaxListeners(9999)

        const new_instance = new Injector(real_parent, providers, parent_emitter)
        new_instance.set_provider(Injector, new InjectorProvider('injector', new_instance))

        real_parent.children.push(new_instance)
        return new_instance
    }

    /**
     * 向注入器中注册指定的 token 和 provider 的映射关系。
     *
     * @param token
     * @param provider
     */
    set_provider(token: any, provider: Provider<any>) {
        this.providers.set(token, provider)
    }

    /**
     * 根据 token 查找依赖。
     *
     * @param token
     * @param info 一些帮助调试的信息
     */
    get<T>(token: string, info?: string): Provider<T> | undefined
    get<T extends object>(token: AbstractConstructor<T>, info?: string): Provider<T> | undefined
    get<T extends object>(token: any, info?: string): Provider<T> | undefined {
        return this.providers.get(token) ?? this.parent.get(token, info)
    }

    /**
     * 仅在注入器本身进行查找依赖，不向上查找。
     *
     * @param token
     */
    local_has(token: any): boolean {
        return this.providers.has(token)
    }

    /**
     * 查找依赖，返回依赖是否存在。
     *
     * @param token
     */
    has(token: any): boolean {
        return this.providers.has(token) || this.parent.has(token)
    }

    /**
     * 触发一个事件。
     *
     * @param event
     */
    emit(event: TpEvent) {
        this.emitter.emit(event)
    }

    /**
     * 监听 tp 事件。
     *
     * @param event
     * @param callback
     */
    on(event: TpEvent, callback: () => void) {
        this.emitter.on(event, callback)
    }
}
