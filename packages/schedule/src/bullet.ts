/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Dora } from '@tarpit/dora'
import { Crontab } from './crontab'
import { TaskUnit } from './tools'

export class Bullet {

    public crontab: Crontab
    public execution: Dora
    public next_bullet: Bullet | null = null

    constructor(
        public id: string,
        public handler: Function,
        public unit: TaskUnit,
    ) {
        if (!unit.crontab_str) {
            throw new Error()
        }
        this.crontab = Crontab.parse(unit.crontab_str, unit.options)
        this.execution = this.crontab.next()
    }
}
