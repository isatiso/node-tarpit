/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { EventEmitter } from 'events'
import { AbstractConstructor, Constructor, InjectorEventEmitter, InjectorType, Provider, TpEvent, TpEventCollector } from '../types'
import { NullInjector } from './null-injector'
import { ValueProvider } from './value-provider'

export class Injector implements InjectorType, InjectorEventEmitter {

    static instance_count = 1

    readonly id = Injector.instance_count++
    readonly children: Injector[] = []
    readonly root: Injector
    protected providers: Map<any, Provider<any>> = new Map([])
    protected providers_id_map: Map<string, Provider<any>> = new Map([])

    constructor(
        protected parent: InjectorType,
        protected readonly emitter: EventEmitter,
        root?: Injector,
    ) {
        this.root = root ?? this
    }

    static create(parent?: Injector): Injector {
        const emitter = parent ? parent.emitter : new EventEmitter().setMaxListeners(9999)
        const injector = new Injector(parent ?? new NullInjector(), emitter, parent?.root)
        injector.parent.children.push(injector)
        if (!parent) {
            ValueProvider.create(injector, { provide: EventEmitter, useValue: emitter })
        }
        ValueProvider.create(injector, { provide: Injector, useValue: injector })
        return injector
    }

    set<T>(token: any, provider: Provider<T>): Provider<T> {
        this.providers.set(token, provider)
        return provider
    }

    set_id<T>(id: string, provider: Provider<T>): Provider<T> {
        if (!id) {
            return provider
        }
        this.providers_id_map.set(id, provider)
        return provider
    }

    get<T>(token: AbstractConstructor<T>): Provider<T> | undefined
    get<T>(token: Constructor<T>): Provider<T> | undefined
    get<T>(token: string | symbol): Provider<T> | undefined
    get<T extends object>(token: any): Provider<T> | undefined {
        if (!token) {
            return
        }
        return this.providers.get(token) ?? this.parent.get(token)
    }

    get_id<T>(id: string): Provider<T> | undefined {
        return this.providers_id_map.get(id) ?? this.parent.get_id(id)
    }

    has(token: any): boolean {
        if (!token) {
            return false
        }
        return this.providers.has(token) || this.parent.has(token)
    }

    emit<Event extends TpEvent>(event: Event, ...args: Parameters<TpEventCollector[Event]>) {
        return this.emitter.emit(event, ...args)
    }

    on<Event extends TpEvent>(event: Event, callback: TpEventCollector[Event]) {
        this.emitter.on(event, callback)
        return this
    }

    once<Event extends TpEvent>(event: Event, callback: TpEventCollector[Event]) {
        this.emitter.once(event, callback)
        return this
    }
}
