/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '../annotations'

export type TpLoaderType = {
    on_start: () => Promise<void>,
    on_terminate: () => Promise<void>,
    on_load: (meta: any) => void
}

export interface LifecycleNode {
    token: any
    on_start?: () => Promise<void>
    on_terminate?: () => Promise<void>
    deps: Set<any>
    dependents: Set<any>
}

@TpService()
export class TpLoader {

    private _nodes: Map<any, LifecycleNode> = new Map()
    private _loaders: Map<symbol, TpLoaderType['on_load']> = new Map()

    register(token: symbol, loader: TpLoaderType, deps?: any[]) {
        if (!this._loaders.has(token)) {
            this._loaders.set(token, loader.on_load)
            const node = this._ensure_node(token)
            node.on_start = loader.on_start
            node.on_terminate = loader.on_terminate
            if (deps) {
                this._link_deps(node, deps)
            }
        }
    }

    record(token: any, deps: any[]) {
        this._link_deps(this._ensure_node(token), deps)
    }

    on_start(token: any, init_method: () => Promise<void>) {
        this._ensure_node(token).on_start = init_method
    }

    on_terminate(token: any, quit_method: () => Promise<void>) {
        this._ensure_node(token).on_terminate = quit_method
    }

    load(meta: any & { token: symbol }) {
        const loader = this._loaders.get(meta.token)
        if (!loader) {
            throw new Error(`Can't find loader for component "${meta.cls?.name}"`)
        }
        loader(meta)
    }

    async start(): Promise<void> {
        await this._execute(
            node => node.on_start?.().catch(err => {
                console.log(`Error occurred when starting: ${err.stack}`)
            }),
            node => node.deps,
        )
    }

    async terminate(): Promise<void> {
        await this._execute(
            node => node.on_terminate?.().catch(err => {
                console.log(`Error occurred when terminating: ${err.stack}`)
            }),
            node => node.dependents,
        )
    }

    private _ensure_node(token: any): LifecycleNode {
        if (!this._nodes.has(token)) {
            this._nodes.set(token, { token, deps: new Set(), dependents: new Set() })
        }
        return this._nodes.get(token)!
    }

    private _link_deps(node: LifecycleNode, deps: any[]) {
        for (const dep of deps) {
            if (dep == null || dep === node.token) {
                continue
            }
            const dep_node = this._nodes.get(dep)
            if (dep_node) {
                node.deps.add(dep)
                dep_node.dependents.add(node.token)
            }
        }
    }

    private async _execute(
        run: (node: LifecycleNode) => Promise<any> | undefined,
        get_wait_set: (node: LifecycleNode) => Set<any>,
    ): Promise<void> {
        const completions = new Map<any, { promise: Promise<void>, resolve: () => void }>()
        for (const token of this._nodes.keys()) {
            let resolve!: () => void
            const promise = new Promise<void>(r => resolve = r)
            completions.set(token, { promise, resolve })
        }

        const tasks: Promise<void>[] = []
        for (const [token, node] of this._nodes) {
            const wait_for = [...get_wait_set(node)]
                .filter(dep => completions.has(dep))
                .map(dep => completions.get(dep)!.promise)

            const task = Promise.all(wait_for).then(async () => {
                await run(node)
                completions.get(token)!.resolve()
            })
            tasks.push(task)
        }

        await Promise.allSettled(tasks)
    }
}
