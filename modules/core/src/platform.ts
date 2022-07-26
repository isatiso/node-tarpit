/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData, load_config, TpConfigSchema, } from '@tarpit/config'
import { TpEntry } from './annotations'
import { TpInspector } from './builtin/tp-inspector'
import { TpLoader } from './builtin/tp-loader'
import { BuiltinTpLogger, TpLogger } from './builtin/tp-logger'
import { ClassProvider, Injector, ValueProvider } from './di'
import { get_class_decorator } from './tools/decorator'
import { check_usage, def_to_provider, load_component } from './tools/load-component'
import { stringify } from './tools/stringify'
import { AbstractConstructor, Constructor, ProviderDef } from './types'

export class Platform {

    protected root_injector = Injector.create()
    protected inspector = ClassProvider.create(this.root_injector, { provide: TpInspector, useClass: TpInspector }).create()
    protected loader = ClassProvider.create(this.root_injector, { provide: TpLoader, useClass: TpLoader }).create()
    private started = false
    private terminated = false

    constructor(file_path ?: string)
    constructor(data: TpConfigSchema)
    constructor(data: () => TpConfigSchema)
    constructor(data?: string | TpConfigSchema | (() => TpConfigSchema)) {
        ValueProvider.create(this.root_injector, { provide: ConfigData, useValue: load_config(data) })
        ValueProvider.create(this.root_injector, { provide: Platform, useValue: this })
        ClassProvider.create(this.root_injector, { provide: TpLogger, useClass: BuiltinTpLogger }).create()
        this.root_injector.on('start', this.on_start)
        this.root_injector.on('terminate', this.on_terminate)
    }

    import(def: ProviderDef<any> | Constructor<any>) {
        def_to_provider(def, this.root_injector)
        return this
    }

    bootstrap(tp_entry: Constructor<any>) {
        const meta = get_class_decorator(tp_entry).find(d => d instanceof TpEntry)
        if (!meta) {
            throw new Error(`${stringify(tp_entry)} is not a "TpEntry"`)
        }
        meta.injector = Injector.create(this.root_injector)
        check_usage(this.root_injector, load_component(meta, meta.injector))
        return this
    }

    start() {
        if (this.started) {
            console.log('Tarpit server is started.')
            return this
        }
        this.started = true
        this.root_injector.emit('start')
        return this
    }

    terminate() {
        if (this.terminated) {
            console.log('Tarpit server is terminated.')
            return this
        }
        this.terminated = true
        this.inspector.wait_start().then(() => {
            this.root_injector.emit('terminate')
        })
        return this
    }

    expose<T>(target: AbstractConstructor<T> | Constructor<T> | string | symbol): T | undefined {
        return this.root_injector.get(target as any)?.create() as any
    }

    private on_start = async () => {
        await this.loader.start()
        this.root_injector.emit('start-time', (Date.now() - this.inspector.started_at) / 1000)
    }

    private on_terminate = async () => {
        await this.inspector.wait_start()
        await this.loader.terminate()
        this.root_injector.emit('terminate-time', (Date.now() - this.inspector.terminated_at) / 1000)
    }
}
