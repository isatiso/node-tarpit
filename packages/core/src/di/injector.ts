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

export const RootInjector = Symbol.for('œœ.root.injector')

export class Injector implements InjectorType, InjectorEventEmitter {

    readonly children: Injector[] = []
    protected providers: Map<any, Provider<any>> = new Map([])

    private constructor(
        protected parent: InjectorType,
        protected readonly emitter: EventEmitter,
    ) {
    }

    static create(parent?: Injector): Injector {
        const emitter = parent ? parent.emitter : new EventEmitter().setMaxListeners(9999)
        const injector = new Injector(parent ?? new NullInjector(), emitter)
        injector.parent.children.push(injector)
        if (!parent) {
            ValueProvider.create(injector, EventEmitter, emitter)
        }
        ValueProvider.create(injector, Injector, injector)
        return injector
    }

    set<T>(token: any, provider: Provider<T>): Provider<T> {
        this.providers.set(token, provider)
        return provider
    }

    get<T>(token: AbstractConstructor<T>): Provider<T> | undefined
    get<T>(token: Constructor<T>): Provider<T> | undefined
    get<T>(token: string | symbol): Provider<T> | undefined
    get<T extends object>(token: any): Provider<T> | undefined {
        return this.providers.get(token) ?? this.parent.get(token)
    }

    has(token: any): boolean {
        return this.providers.has(token) || this.parent.has(token)
    }

    /**
     * See [[EventEmitter.emit]]
     */
    emit<Event extends TpEvent>(event: Event, ...args: Parameters<TpEventCollector[Event]>) {
        return this.emitter.emit(event, ...args)
    }

    /**
     * See [[EventEmitter.on]]
     */
    on<Event extends TpEvent>(event: Event, callback: TpEventCollector[Event]) {
        this.emitter.on(event, callback)
        return this
    }

    /**
     * See [[EventEmitter.once]]
     */
    once<Event extends TpEvent>(event: Event, callback: TpEventCollector[Event]) {
        this.emitter.once(event, callback)
        return this
    }
}