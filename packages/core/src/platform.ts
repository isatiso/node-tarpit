/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData, load_config, TpConfigSchema, } from '@tarpit/config'
import { TpEntry, TpPlugin, TpPluginType } from './annotations'
import { TpInnerLoader } from './builtin/tp-inner-loader'
import { START_TIME, STARTED_AT, TERMINATE_TIME, TERMINATED_AT, TpInspector } from './builtin/tp-inspector'
import { BuiltinTpLogger, TpLogger } from './builtin/tp-logger'
import { TpPluginCenter } from './builtin/tp-plugin-center'
import { UUID } from './builtin/uuid'
import { ClassProvider, Injector, ValueProvider } from './di'
import { def_to_provider, load_component } from './tools/inner/load-component'
import { stringify } from './tools/stringify'
import { get_class_decorator } from './tools/tp-decorator'
import { AbstractConstructor, Constructor, ProviderDef } from './types'

export class Platform {

    protected root_injector = Injector.create()
    protected inspector = ClassProvider.create(this.root_injector, TpInspector, TpInspector).create()
    protected plugin_center = ClassProvider.create(this.root_injector, TpPluginCenter, TpPluginCenter).create()
    private started = false
    private terminated = false

    constructor(file_path ?: string)
    constructor(data: TpConfigSchema)
    constructor(data: () => TpConfigSchema)
    constructor(data?: string | TpConfigSchema | (() => TpConfigSchema)) {
        ValueProvider.create(this.root_injector, ConfigData, load_config(data))
        ValueProvider.create(this.root_injector, Platform, this)
        ClassProvider.create(this.root_injector, UUID, UUID)
        ClassProvider.create(this.root_injector, TpLogger, BuiltinTpLogger)
        this.root_injector.on('start', this.on_start)
        this.root_injector.on('terminate', this.on_terminate)
        this.plug(TpInnerLoader as any)
    }

    /**
     * 添加系统插件，如 HTTPServer Schedule AMQP 等。
     */
    plug(tp_plugin: Constructor<TpPluginType>): this {
        const meta = get_class_decorator(tp_plugin)?.find((d): d is TpPlugin => d instanceof TpPlugin)
        if (!meta) {
            throw new Error(`${stringify(tp_plugin)} is not a "TpPlugin"`)
        }
        if (this.plugin_center.has(meta)) {
            console.warn(`Plugin "${stringify(meta.cls)}" exists, maybe its a mistake.`)
            return this
        }
        this.plugin_center.add(meta)
        const loader_provider = ClassProvider.create(this.root_injector, meta.cls, meta.cls)
        // TODO: 检查 ConfigData
        meta.targets.forEach(loader => this.root_injector.set(loader, loader_provider))
        return this
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
        const meta = get_class_decorator(tp_entry)?.find(d => d instanceof TpEntry)
        if (!meta) {
            throw new Error(`${stringify(tp_entry)} is not a "TpEntry"`)
        }
        load_component(meta, Injector.create(this.root_injector))
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

    async prepare(): Promise<this> {
        return new Promise(resolve => {
            if (this.inspector?.start_time) {
                resolve(this)
            } else {
                this.root_injector.once('start-time', () => resolve(this))
            }
        })
    }

    terminate() {
        if (this.terminated) {
            console.log('Tarpit server is started.')
            return this
        }
        this.terminated = true
        this.prepare().then(() => {
            ValueProvider.create(this.root_injector, TERMINATED_AT, Date.now())
            this.root_injector.emit('terminate')
        })
        return this
    }

    /**
     * 暴露 root_injector，允许直接调用服务，一般用于测试
     */
    call<RES>(executor: (injector: Injector) => RES): RES {
        return executor(this.root_injector)
    }

    /**
     * 向外暴露指定 TpService，一般用于测试
     */
    expose_service<T>(target: AbstractConstructor<T> | Constructor<T> | string | symbol): T | undefined {
        return this.root_injector.get(target as any)?.create() as any
    }

    /**
     * 向外暴露指定 TpService 的一个 method，一般用于测试
     */
    expose_service_method<T extends object, P extends keyof T>(target: AbstractConstructor<T>, prop: P): T[P] extends (...args: any) => any ? { (...args: Parameters<T[P]>): ReturnType<T[P]> } : never {
        const executor = this.root_injector.get(target)?.create()
        if (!executor) {
            return undefined as any
        }
        const method = executor[prop] as any
        if (typeof method !== 'function') {
            return undefined as any
        }
        return method?.bind(executor)
    }

    private on_start = async () => {

        await Promise.all(this.plugin_center.start()).catch(() => undefined)

        const logger = this.root_injector.get(TpLogger)?.create()!
        const duration = (Date.now() - this.inspector.started_at) / 1000
        ValueProvider.create(this.root_injector, START_TIME, duration)
        logger.after_start()
        this.root_injector.emit('start-time', duration)
    }

    private on_terminate = async () => {

        await this.prepare()

        await Promise.all(this.plugin_center.terminate()).catch(() => undefined)
        await this.root_injector.wait_all_quit()

        const logger = this.root_injector.get(TpLogger)?.create()!
        const duration = (Date.now() - this.inspector.terminated_at) / 1000
        ValueProvider.create(this.root_injector, TERMINATE_TIME, duration)
        logger.after_destroy()
        this.root_injector.emit('terminate-time', duration)
    }
}
