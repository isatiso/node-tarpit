/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */
import { ConfigData } from '@tarpit/config'
import { BehaviorSubject, filter, finalize, find, map, of, Subject, switchMap, tap } from 'rxjs'
import { TpEntry } from './annotations'
import { TpConfigData } from './builtin/tp-config-data'
import { TpLoader } from './builtin/tp-loader'
import { ClassProvider, Injector, ValueProvider } from './di'
import { get_class_decorator } from './tools/decorator'
import { load_provider_def_or_component, load_component } from './tools/load-component'
import { stringify } from './tools/stringify'
import { AbstractConstructor, Constructor, ProviderDef, TpConfigSchema } from './types'

export class Platform {

    protected root_injector = Injector.create()
    protected loader = ClassProvider.create(this.root_injector, { provide: TpLoader, useClass: TpLoader }).create()

    private start$ = new Subject<(() => void) | undefined>()
    private terminate$ = new Subject<(() => void) | undefined>()
    private started$ = new BehaviorSubject<boolean>(false)
    private terminated$ = new BehaviorSubject<boolean>(false)

    constructor(data: ConfigData<TpConfigSchema>) {
        this.start$.pipe(
            filter(() => this._started_at < 0),
            tap(() => this._started_at = Date.now()),
            tap(() => this.root_injector.on$.next()),
            switchMap(after_start => of(null).pipe(
                switchMap(() => this.loader.start()),
                map(() => this._start_time = (Date.now() - this._started_at) / 1000),
                tap(() => after_start?.()),
                tap(duration => console.info(`Tarpit server started at ${new Date().toISOString()}, during ${duration}s`)),
                finalize(() => this.started$.next(true)),
            )),
        ).subscribe()
        this.terminate$.pipe(
            filter(() => this._terminated_at < 0),
            tap(() => this._terminated_at = Date.now()),
            tap(() => this.root_injector.off$.next()),
            switchMap(after_terminate => of(null).pipe(
                switchMap(() => this.started$.pipe(find(Boolean))),
                switchMap(() => this.loader.terminate()),
                map(() => this._terminate_time = (Date.now() - this._terminated_at) / 1000),
                tap(() => after_terminate?.()),
                tap(duration => console.info(`Tarpit server destroyed at ${new Date().toISOString()}, during ${duration}s`)),
                finalize(() => this.terminated$.next(true)),
            )),
        ).subscribe()
        ValueProvider.create(this.root_injector, { provide: TpConfigData, useValue: data })
        ValueProvider.create(this.root_injector, { provide: Platform, useValue: this })
    }

    private _started_at = -1
    get started_at(): number {
        return this._started_at
    }

    private _terminated_at = -1
    get terminated_at(): number {
        return this._terminated_at
    }

    private _start_time = -1
    get start_time(): number {
        return this._start_time
    }

    private _terminate_time = -1
    get terminate_time(): number {
        return this._terminate_time
    }

    import(def: ProviderDef<any> | Constructor<any>) {
        load_provider_def_or_component(def, this.root_injector)
        return this
    }

    start(after_start?: () => void): Promise<number> {
        if (this._started_at > 0) {
            console.info('Tarpit server is started.')
            return this.started()
        }
        this.start$.next(after_start)
        return this.started()
    }

    terminate(after_terminate?: () => void): Promise<number> {
        if (this._terminated_at > 0) {
            console.info('Tarpit server is terminated.')
            return this.terminated()
        }
        this.terminate$.next(after_terminate)
        return this.terminated()
    }

    expose<T>(target: AbstractConstructor<T> | Constructor<T> | string | symbol): T | undefined {
        return this.root_injector.get(target as any)?.create() as any
    }

    async started(): Promise<number> {
        return new Promise(resolve => {
            this.started$.pipe(find(Boolean)).subscribe(() => resolve(this._start_time))
        })
    }

    async terminated(): Promise<number> {
        return new Promise(resolve => {
            this.terminated$.pipe(find(Boolean)).subscribe(() => resolve(this._terminate_time))
        })
    }
}
