/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { SymbolToken } from '@tarpit/core'
import { Dora } from '@tarpit/dora'
import { TaskUnit } from '../tools'
import { Bullet } from './bullet'

@SymbolToken('schedule')
export class TriggerContext {

    private retry_is_set = false

    constructor(
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

    set retry_limit(value: number) {
        if (!this.retry_is_set) {
            this._retry_limit = value
            this.retry_is_set = true
        }
    }

    get crontab(): string {
        return this.unit.crontab_str
    }

    static from(bullet: Bullet) {
        return new TriggerContext(bullet.id, bullet.unit, bullet.execution)
    }
}
