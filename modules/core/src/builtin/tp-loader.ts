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

@TpService()
export class TpLoader {

    private _on_starts: (() => Promise<void>)[] = []
    private _on_terminates: (() => Promise<void>)[] = []
    private _loaders: Map<symbol, TpLoaderType['on_load']> = new Map()

    register(token: symbol, loader: TpLoaderType) {
        if (!this._loaders.has(token)) {
            this._loaders.set(token, loader.on_load)
            this._on_starts.push(loader.on_start)
            this._on_terminates.push(loader.on_terminate)
        }
    }

    on_terminate(quit_method: () => Promise<any>) {
        this._on_terminates.push(quit_method)
    }

    load(meta: any & { token: symbol }) {
        const loader = this._loaders.get(meta.token)
        if (!loader) {
            throw new Error(`Can't find loader for component "${meta.cls?.name}"`)
        }
        loader(meta)
    }

    start(): Promise<void[]> {
        return Promise.all(this._on_starts.map(f => f()))
    }

    terminate(): Promise<void[]> {
        return Promise.all(this._on_terminates.map(f => f()))
    }
}
