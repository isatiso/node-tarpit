/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { merge, Observable, Subject, takeUntil } from 'rxjs'
import { AbstractConstructor, Constructor, InjectorType, Provider, ProviderDef } from '../types'
import { NullInjector } from './null-injector'
import { ValueProvider } from './value-provider'

export class Injector implements InjectorType {

    static instance_count = 1

    readonly id = Injector.instance_count++
    readonly children: Injector[] = []
    readonly root: Injector = this._root ?? this
    protected providers: Map<any, Provider<any>> = new Map([])
    protected providers_id_map: Map<string, Provider<any>> = new Map([])

    readonly on$: Subject<void> = this.root.on$ ?? new Subject<void>()
    readonly off$: Subject<void> = this.root.off$ ?? new Subject<void>()
    private _provider_change$ = new Subject<any>()
    readonly provider_change$: Observable<any>

    constructor(
        protected parent: InjectorType,
        private _root?: Injector,
    ) {
        if (this.root === this) {
            this.on$ = new Subject()
            this.off$ = new Subject()
            this.provider_change$ = this._provider_change$.pipe()
        } else {
            this.provider_change$ = merge(this._provider_change$, this.root._provider_change$)
            this.on$ = this.root.on$
            this.off$ = this.root.off$
        }
    }

    static create(parent?: Injector): Injector {
        const injector = new Injector(parent ?? new NullInjector(), parent?.root)
        injector.parent.children.push(injector)
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

    provider_change(token: any) {
        this._provider_change$.next(token)
    }
}
