/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { AbstractConstructor } from './__types__'
import { Injector } from './injector'
import { Platform } from './platform'

export class DebugPlatform extends Platform {

    constructor() {
        super()
        // this.root_injector.set_provider(Platform, new ValueProvider('Platform', this))
        // this.root_injector.set_provider(Revolver, new ValueProvider('Revolver', this.revolver))
        // this.root_injector.set_provider(TpServer, new ValueProvider('TpServer', this.server))
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
    expose_service<T extends object>(target: AbstractConstructor<T>): T | undefined {
        return this.root_injector.get(target)?.create()
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
}
