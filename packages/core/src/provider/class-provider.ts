/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */


import { Constructor, Provider } from '../__types__'
import { MetaTools } from '../__tools__/meta-tools'
import { Injector } from '../injector'
import { Stranger } from './stranger'

/**
 * @private
 *
 * @category Injector
 */
export class ClassProvider<M extends object> implements Provider<M> {

    public resolved?: M
    public name: string
    public used = false

    constructor(
        private cls: Constructor<M>,
        public injector: Injector,
        private readonly multi?: boolean,
    ) {
        this.name = cls.name
        this.multi = this.multi ?? false
    }

    /**
     * @author plankroot
     * @function create instance of this.cls and of its dependence if needed.
     *
     * @param parents: record calling path.
     *
     * @return Provider
     */
    create(parents?: any[]): M {
        const exist = parents?.indexOf(this.cls) ?? -1
        if (exist >= 0) {
            const circle_path = parents?.slice(exist) ?? []
            circle_path.push(this.cls)
            throw new Error('circle dependency: ' + circle_path.map(cls => cls.name).join(' => '))
        }
        parents = (parents ?? []).concat(this.cls)
        this.used = true
        if (this.multi) {
            return this._get_param_instance(parents)
        }
        if (!this.resolved) {
            this.resolved = this._get_param_instance(parents)
        }
        return this.resolved
    }

    /**
     * @author plankroot
     * @function mark used of provider recursively
     * @param parents
     */
    set_used(parents?: any[]): void {
        this.used = true
        this._set_param_instance_used([this.cls, ...parents ?? []])
    }

    private _get_param_instance(parents?: any[]) {
        const param_list = this._extract_param_types(parents)?.map(provider => provider?.create(parents)) ?? []
        const instance = new this.cls(...param_list)

        MetaTools.ClassMeta(this.cls.prototype)
            .do(meta => {
                if (meta?.on_destroy) {
                    const destroy_method = meta.on_destroy.value.bind(instance)
                    const stranger = this.injector.get(Stranger)?.create()
                    const announcer = new Promise<void>(resolve => {
                        this.injector.on('tp-destroy', () => {
                            Promise.resolve(destroy_method()).then(() => resolve())
                        })
                    })
                    stranger?.mark(announcer)
                }
            })

        return instance
    }

    private _set_param_instance_used(parents?: any[]) {
        this._extract_param_types(parents)?.forEach((provider: Provider<any>) => provider?.set_used(parents))
    }

    private _extract_param_types(parents?: any[]) {
        const inject_token_map = MetaTools.ClassMeta(this.cls.prototype).value?.parameter_injection
        return MetaTools.get_constructor_parameter_types(this.cls)
            ?.map((origin_token: any, i: number) => {
                const token = inject_token_map?.[i] ?? origin_token
                if (token === undefined) {
                    throw new Error(`type 'undefined' at ${this.cls?.name}.constructor[${i}], if it's not specified, there maybe a circular import.`)
                }
                const provider = this.injector.get(token, `${parents?.map(p => p.name).join(' -> ')}`)
                if (provider) {
                    return provider
                }
                throw new Error(`Can't find provider of "${token}" in [${this.cls?.name}, constructor, args[${i}]]`)
            })
    }
}
