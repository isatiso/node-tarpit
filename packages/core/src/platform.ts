/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData, load_config, TpConfigSchema, } from '@tarpit/config'
import { TpEntry } from './annotations'
import { START_TIME, STARTED_AT, TERMINATE_TIME, TERMINATED_AT, TpInspector } from './builtin/tp-inspector'
import { TpLoader } from './builtin/tp-loader'
import { BuiltinTpLogger, TpLogger } from './builtin/tp-logger'
import { ClassProvider, Injector, RootInjector, ValueProvider } from './di'
import { get_class_decorator } from './tools/decorator'
import { check_usage, def_to_provider, load_component } from './tools/load-component'
import { stringify } from './tools/stringify'
import { AbstractConstructor, Constructor, ProviderDef } from './types'

export class Platform {

    protected root_injector = Injector.create()
    protected inspector = ClassProvider.create(this.root_injector, TpInspector, TpInspector).create()
    protected plugin_center = ClassProvider.create(this.root_injector, TpLoader, TpLoader).create()
    private started = false
    private terminated = false

    constructor(file_path ?: string)
    constructor(data: TpConfigSchema)
    constructor(data: () => TpConfigSchema)
    constructor(data?: string | TpConfigSchema | (() => TpConfigSchema)) {
        ValueProvider.create(this.root_injector, ConfigData, load_config(data))
        ValueProvider.create(this.root_injector, RootInjector, this.root_injector)
        ValueProvider.create(this.root_injector, Platform, this)
        ClassProvider.create(this.root_injector, TpLogger, BuiltinTpLogger).create()
        this.root_injector.on('start', this.on_start)
        this.root_injector.on('terminate', this.on_terminate)
    }

    /**
     * 直接加载 TpModule 到 [[Platform.root_injector]] 的接口。
     * @param def
     */
    import(def: ProviderDef<any> | Constructor<any>) {
        def_to_provider(def, this.root_injector)
        return this
    }

    /**
     * 直接加载一个包含 routers 的 TpModule。
     *
     * @param tp_entry
     */
    bootstrap(tp_entry: Constructor<any>) {
        const meta = get_class_decorator(tp_entry).find(d => d instanceof TpEntry)
        if (!meta) {
            throw new Error(`${stringify(tp_entry)} is not a "TpEntry"`)
        }
        meta.injector = Injector.create(this.root_injector)
        check_usage(this.root_injector, load_component(meta, meta.injector))
        return this
    }

    /**
     * 开始监听请求。
     */
    start() {
        if (this.started) {
            console.log('Tarpit server is started.')
            return this
        }
        this.started = true
        ValueProvider.create(this.root_injector, STARTED_AT, Date.now())
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
            ValueProvider.create(this.root_injector, TERMINATED_AT, Date.now())
            this.root_injector.emit('terminate')
        })
        return this
    }

    /**
     * 向外暴露指定 TpService，一般用于测试
     */
    expose<T>(target: AbstractConstructor<T> | Constructor<T> | string | symbol): T | undefined {
        return this.root_injector.get(target as any)?.create() as any
    }

    private on_start = async () => {

        await this.plugin_center.start()

        const duration = (Date.now() - this.inspector.started_at) / 1000
        ValueProvider.create(this.root_injector, START_TIME, duration)
        this.root_injector.emit('start-time', duration)
    }

    private on_terminate = async () => {

        await this.inspector.wait_start()

        await this.plugin_center.terminate()
        await this.root_injector.wait_all_quit()

        const duration = (Date.now() - this.inspector.terminated_at) / 1000
        ValueProvider.create(this.root_injector, TERMINATE_TIME, duration)
        this.root_injector.emit('terminate-time', duration)
    }
}
