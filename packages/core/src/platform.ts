/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData, load_config, TpConfigSchema, } from '@tarpit/config'
import { collect_worker, def_to_provider, load_component } from './__tools__/collector'
import { MetaTools } from './__tools__/tp-meta-tools'
import { Plugins, PluginSet, PluginSetToken, TpPluginConstructor } from './__tools__/tp-plugin'
import { Constructor, ProviderDef } from './__types__'
import { Stranger } from './builtin/stranger'
import { BuiltinTpLogger, TpLogger } from './builtin/tp-logger'
import { TpRootLoader } from './builtin/tp-root-loader'
import { UUID } from './builtin/uuid'
import { Injector } from './injector'
import { ClassProvider, ValueProvider } from './provider'
import { TpAssemblyCollection } from './tp-component-type'

/**
 * Tp 运行时。
 */
export class Platform<T extends Plugins = Plugins> {

    /**
     * 根注入器。
     */
    protected root_injector = Injector.create()

    constructor(file_path ?: string)
    constructor(data: TpConfigSchema)
    constructor(data: () => TpConfigSchema)
    constructor(data?: string | TpConfigSchema | (() => TpConfigSchema)) {
        this.root_injector.set_provider(ConfigData, new ValueProvider('ConfigData', load_config(data)))
        this.root_injector.set_provider('œœ-TpStartedAt', new ValueProvider('TpStartedAt', Date.now()))
        this.root_injector.set_provider('œœ-TpRoot', new ValueProvider('TpRootLoader', TpRootLoader))
        this.root_injector.set_provider(PluginSetToken, new ValueProvider('PluginSet', new Set()))
        this.root_injector.set_provider(UUID, new ClassProvider(UUID, this.root_injector))
        this.root_injector.set_provider(Platform, new ValueProvider('Platform', this))
        this.root_injector.set_provider(Stranger, new ClassProvider(Stranger, this.root_injector))
        this.root_injector.set_provider(TpRootLoader, new ClassProvider(TpRootLoader, this.root_injector))
        this.root_injector.set_provider(TpLogger, new ClassProvider(BuiltinTpLogger, this.root_injector))
    }

    /**
     * 添加系统插件，如 HTTPServer Schedule AMQP 等。
     */
    plug<P extends T>(plugin: P): Platform<Exclude<T, P>> {
        // TODO: 检查 ConfigData
        const _plugin = plugin as P & TpPluginConstructor<any>
        const plugin_set = this.root_injector.get<PluginSet>(PluginSetToken)?.create()!
        if (!plugin_set.has(_plugin)) {
            const meta = MetaTools.PluginMeta(_plugin.prototype).value
            if (!meta) {
                throw new Error(`Plugin "${_plugin.name ?? _plugin.toString()}" has no PluginMeta.`)
            }
            plugin_set.add(_plugin)
            meta.loader_list.forEach(loader => this.root_injector.set_provider(loader, new ValueProvider(meta.type, _plugin)))
            this.root_injector.set_provider(_plugin, new ClassProvider(_plugin, this.root_injector))
        } else {
            console.warn(`Plugin "${_plugin.name ?? _plugin.toString()}" exists, maybe its a mistake.`)
        }
        return this
    }

    /**
     * 直接挂载 TpService 到 [[Platform.root_injector]] 的接口。
     * @param def
     */
    provide(def: (ProviderDef<any> | Constructor<any>)) {
        def_to_provider(def, this.root_injector)
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
     * 开始监听请求。
     */
    start() {
        const plugins = this.root_injector.get<PluginSet>(PluginSetToken)?.create()!
        const logger = this.root_injector.get(TpLogger)?.create()!
        Promise.all(Array.from(plugins).map(plugin => this.root_injector.get(plugin)?.create()?.start()))
            .catch(() => undefined)
            .then(() => logger.after_start())
        return this
    }

    async destroy(): Promise<void> {
        const plugins = this.root_injector.get<PluginSet>(PluginSetToken)?.create()!
        const logger = this.root_injector.get(TpLogger)?.create()!
        this.root_injector.emit('tp-destroy')
        await this.root_injector.get(Stranger)?.create().wait_all_quit()
        for (const plugin of Array.from(plugins)) {
            await this.root_injector.get(plugin)?.create().destroy()
        }
        logger.after_destroy()
    }
}
