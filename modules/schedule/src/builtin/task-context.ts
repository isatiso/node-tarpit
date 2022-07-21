/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Dora } from '@tarpit/dora'
import { TaskUnit } from '../tools/collect-tasks'
import { Bullet } from './bullet'

export class TaskContext<T = {}> {

    private _retry_is_set = false
    private _custom_data: T = {} as any

    private constructor(
        public readonly id: string,
        public readonly unit: TaskUnit,
        public readonly execution: Dora,
    ) {
    }

    private _count = 0
    get count(): number {
        return this._count
    }

    private _retry_limit = 0
    get retry_limit(): number {
        return this._retry_limit
    }

    get crontab(): string {
        return this.unit.crontab_str
    }

    static from<R = {}>(bullet: Bullet) {
        return new TaskContext<R>(bullet.id, bullet.unit, bullet.execution)
    }

    set<M extends keyof T>(key: M, value: T[M]) {
        this._custom_data[key] = value
    }

    get<M extends keyof T>(key: M): T[M] {
        return this._custom_data[key]
    }

    set_retry_limit(value: number) {
        if (!this._retry_is_set) {
            this._retry_limit = value
            this._retry_is_set = true
        }
    }

    incr() {
        return ++this._count
    }
}
