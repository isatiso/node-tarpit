/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData, load_config, TpConfigSchema, } from '@tarpit/config'
import { collect_worker, def2Provider, load_component } from './__tools__/collector'
import { MetaTools } from './__tools__/tp-meta-tools'
import { TpPluginConstructor } from './__tools__/tp-plugin'

import { Constructor, ProviderDef } from './__types__'
import { UUID } from './builtin'
import { PluginSet } from './builtin/plugin-set'
import { Stranger } from './builtin/stranger'
import { Injector } from './injector'
import { ClassProvider, ValueProvider } from './provider'
import { TpAssemblyCollection, TpComponentCollection, TpRootMeta } from './tp-component-type'

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
    private readonly _config_data?: ConfigData

    /**
     * @private
     * 收集需要启动和销毁的插件。
     */
    private _plugin_set = new PluginSet()

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
        this.root_injector.set_provider(PluginSet, new ValueProvider('PluginSet', this._plugin_set))

        // 设置默认的内置工具。
        this.root_injector.set_provider(UUID, new ClassProvider(UUID, this.root_injector))
        this.root_injector.set_provider('œœ-TpRoot', new ValueProvider('TpRoot', Platform))
        this.root_injector.set_provider(Platform, new ValueProvider('Platform', this))
    }

    /**
     * 添加系统插件，如 HTTPServer Schedule AMQP 等。
     */
    plug<K extends keyof TpComponentCollection>(plugin: TpPluginConstructor<K>) {
        // TODO: 检查 ConfigData
        if (!this._plugin_set.plugins.has(plugin)) {
            const meta = MetaTools.PluginMeta(plugin.prototype).value
            if (!meta) {
                throw new Error(`Plugin "${plugin.name ?? plugin.toString()}" has no PluginMeta.`)
            }
            this._plugin_set.plugins.add(plugin)
            meta.loader_list.forEach(loader => this.root_injector.set_provider(loader, new ValueProvider(meta.type, plugin)))
            this.root_injector.set_provider(plugin, new ClassProvider(plugin, this.root_injector))
        } else {
            console.warn(`Plugin "${plugin.name ?? plugin.toString()}" exists, maybe its a mistake.`)
        }
        return this
    }

    load(meta: TpRootMeta, injector: Injector): void {
        const plugins = injector.get(PluginSet)!.create().plugins

        Array.from(plugins).forEach(plugin => {
            const plugin_meta = MetaTools.PluginMeta(plugin.prototype).value!
            const plugin_component_array = (meta[plugin_meta.option_key as keyof TpRootMeta] ?? []) as Array<Constructor<any>>
            for (const component of plugin_component_array) {
                const component_meta = MetaTools.ensure_component(component).value
                if (component_meta.type !== plugin_meta.type) {
                    continue
                }
                load_component(component, injector)
            }
        })
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
    import<Type extends keyof TpAssemblyCollection>(module: Constructor<any>, type: Type) {
        collect_worker(module, this.root_injector)
        return this
    }

    /**
     * 直接加载一个包含 routers 的 TpModule。
     *
     * @param module
     */
    bootstrap(module: Constructor<any>) {
        const meta = MetaTools.ensure_component(module).value
        load_component(meta.self, Injector.create(this.root_injector))
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

        Promise.all(Array.from(this._plugin_set.plugins).map(plugin => {
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
        for (const plugin of Array.from(this._plugin_set.plugins)) {
            const instance = this.root_injector.get(plugin)?.create()
            if (instance) {
                await instance.destroy()
            }
        }
    }
}
