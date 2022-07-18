/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { SymbolToken } from '@tarpit/core'
import { Dora } from '@tarpit/dora'
import { Crontab } from '../crontab'
import { TaskUnit } from '../tools'

@SymbolToken('schedule')
export class Bullet {

    public crontab: Crontab
    public execution: Dora
    public next_bullet: Bullet | undefined = undefined

    constructor(
        public id: string,
        public handler: (execution: Dora, current: Bullet) => Promise<void>,
        public unit: TaskUnit,
    ) {
        if (!unit.crontab_str) {
            throw new Error()
        }
        this.crontab = Crontab.parse(unit.crontab_str, unit.options)
        this.execution = this.crontab.next()
    }
}
