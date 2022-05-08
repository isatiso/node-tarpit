/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ConfigData, load_config, TpConfigSchema, } from '@tarpit/config'

import { Constructor, ProviderDef } from './__types__'
import { TpComponentCollector, TpModuleLikeCollector } from './__tools__/component-types'
import { TpPluginConstructor } from './__tools__/plugin-types'
import { TokenTools } from './__tools__/token-tools'
import { Timestamp, UUID } from './builtin'
import { Injector } from './injector'
import { ClassProvider, def2Provider, ValueProvider } from './provider'
import { Stranger } from './provider/stranger'

/**
 * Tp 运行时。
 *
 * @category Platform
 */
export class Platform {

    /**
     * @protected
     * 根注入器，在它上面还有 NullInjector。
     */
    protected root_injector = Injector.create()
    /**
     * @private
     * 记录创建 [[Platform]] 的时间，用于计算启动时间。
     */
    private readonly started_at: number

    /**
     * @private
     * ConfigData 实例，用于管理加载的配置文件内容。
     */
    private _config_data?: ConfigData

    /**
     * @private
     * 收集需要启动和销毁的插件。
     */
    private _plugins = new Set<TpPluginConstructor<any>>()

    /**
     * 加载配置文件，读文件方式。
     * @param file_path
     */
    constructor(file_path?: string)
    /**
     * 加载配置文件，JSON 对象方式。
     * @param data
     */
    constructor(data: TpConfigSchema)
    /**
     * 加载配置文件，函数方式。
     * @param data
     */
    constructor(data: () => TpConfigSchema)
    constructor(data?: string | TpConfigSchema | (() => TpConfigSchema)) {

        this.started_at = Date.now()

        this._config_data = load_config(data)

        this.root_injector.set_provider(ConfigData, new ValueProvider('ConfigData', this._config_data))

        // 设置默认的内置 Provider，如果没有另外设置 Provider 时，查找结果为 null，而不会查找到 NullInjector。
        this.root_injector.set_provider(Stranger, new ValueProvider('Stranger', new Stranger()))

        // 设置默认的内置工具。
        this.root_injector.set_provider(UUID, new ClassProvider(UUID, this.root_injector))
        this.root_injector.set_provider(Timestamp, new ClassProvider(Timestamp, this.root_injector, true))
    }

    /**
     * 添加系统插件，如 HTTPServer Schedule AMQP 等。
     */
    plug<K extends keyof TpComponentCollector>(plugin: TpPluginConstructor<K> & TpComponentCollector[K]) {
        // TODO: 检查 ConfigData
        if (!this._plugins.has(plugin)) {
            this._plugins.add(plugin)
            this.root_injector.set_provider(plugin.loader, new ValueProvider(plugin.type, plugin))
            this.root_injector.set_provider(plugin, new ClassProvider(plugin, this.root_injector))
        }
    }

    /**
     * 直接挂载 TpService 到 [[Platform.root_injector]] 的接口。
     * @param def
     */
    provide(def: (ProviderDef<any> | Constructor<any>)) {
        def2Provider([def], this.root_injector)
        return this
    }

    /**
     * 直接加载 TpModule 到 [[Platform.root_injector]] 的接口。
     * @param module
     * @param type
     */
    import<Type extends keyof TpModuleLikeCollector>(module: Constructor<any>, type: Type) {
        TokenTools.ensure_component_is(module, type, (meta) => meta && `You can just import a "TpModuleLike" Component, not ${meta.type}.`)
            .do((component_meta: TpModuleLikeCollector[Type]) => {
                component_meta.provider_collector?.(this.root_injector)
            })
        return this
    }

    /**
     * 直接加载一个包含 routers 的 TpModule。
     *
     * @param module
     */
    bootstrap(module: Constructor<any>) {

        const meta = TokenTools.ComponentMeta(module.prototype).value
        if (!meta) {
            throw new Error(`Unknown module "${module.name}".`)
        }

        const sub_injector = Injector.create(this.root_injector)
        if (!meta.on_load) {
            throw Error('not allowed.')
        }

        meta.on_load(meta, sub_injector)

        return this
    }

    /**
     * 自定义启动信息。
     * 设计这个接口的目的是，有时候你可能需要知道程序启动时使用了哪些配置。
     *
     * @param msg_builder
     */
    loading_message(msg_builder: (config: ConfigData) => string | string[]) {
        if (this._config_data) {
            const message = msg_builder(this._config_data as any)
            if (typeof message === 'string') {
                console.log(message)
            } else {
                message?.forEach(info => console.log(info))
            }
        }
        return this
    }

    /**
     * 开始监听请求。
     */
    start() {
        console.log(`tp server start at ${new Date().toISOString()}`)

        Promise.all(Array.from(this._plugins).map(plugin => {
            const instance = this.root_injector.get(plugin)?.create()
            if (instance) {
                return instance.start()
            }
        })).catch(() => {
            // TODO: 处理异常
        })
        // this.mq.start()
        // this.server.listen(port, this._config_data?.get('tp.server_options') ?? {}, () => {
        //     const duration = Date.now() - this.started_at
        //     console.log(`\ntp server started successfully in ${duration / 1000}s.`)
        // })
        return this
    }

    async destroy(): Promise<void> {
        this.root_injector.emit('tp-destroy')
        await this.root_injector.get(Stranger)?.create()?.wait_all_quit()
        for (const plugin of Array.from(this._plugins)) {
            const instance = this.root_injector.get(plugin)?.create()
            if (instance) {
                await instance.destroy()
            }
        }
    }
}
