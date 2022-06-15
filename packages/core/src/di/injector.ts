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

    readonly children: Injector[] = []
    private board = new Set<any>()

    constructor(
        public parent: InjectorType,
        public providers: Map<any, Provider<any>> = new Map(),
        public readonly emitter: EventEmitter,
    ) {
    }

    static create(parent?: Injector): Injector {
        const emitter = parent ? parent.emitter : new EventEmitter().setMaxListeners(9999)
        const injector = new Injector(parent ?? new NullInjector(), new Map([]), emitter)
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

    get<T>(token: AbstractConstructor<T>): Provider<T> | null
    get<T>(token: Constructor<T>): Provider<T> | null
    get<T>(token: string | symbol): Provider<T> | null
    get<T extends object>(token: any): Provider<T> | null {
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

    mark_quit_hook(quit_method: () => Promise<any>) {
        this.board.add(new Promise<void>(resolve => this.once('terminate', () => {
            Promise.resolve(quit_method()).then(() => resolve())
        })))
    }

    async wait_all_quit() {
        await Promise.all(this.board)
    }
}
