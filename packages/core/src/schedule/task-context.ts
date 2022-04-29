/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Dora } from '../builtin'

/**
 * 任务执行上下文。
 *
 * @category Builtin
 */
export class TaskContext {

    private readonly _name?: string
    private readonly _lock_key?: string
    private readonly _lock_expires?: number
    private readonly _crontab: string
    private readonly _pos: string
    private readonly _property_key: string
    private readonly _execution: Dora
    private readonly _temp_exec: boolean

    constructor(
        desc: {
            name: string,
            crontab: string,
            execution: Dora,
            pos: string,
            property_key: string,
            temp_exec?: boolean,
            lock_key?: string
            lock_expires?: number
        }
    ) {
        this._name = desc.name
        this._crontab = desc.crontab
        this._pos = desc.pos
        this._temp_exec = desc.temp_exec ?? false
        this._property_key = desc.property_key
        this._execution = desc.execution
        this._lock_key = desc.lock_key
        this._lock_expires = desc.lock_expires
    }

    get temp_exec(): boolean {
        return this._temp_exec
    }

    get name(): string | undefined {
        return this._name
    }

    get lock_key(): string | undefined {
        return this._lock_key
    }

    get lock_expires(): number | undefined {
        return this._lock_expires
    }

    get crontab(): string {
        return this._crontab
    }

    get pos(): string {
        return this._pos
    }

    get property_key(): string {
        return this._property_key
    }

    get execution(): Dora {
        return this._execution
    }
}
