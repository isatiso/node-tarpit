/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Cron } from '@tarpit/cron'
import { Dora } from '@tarpit/dora'
import { TaskUnit } from '../tools/collect-tasks'

export class Bullet {

    public crontab: Cron
    public execution: Dora
    public next_bullet: Bullet | undefined = undefined

    constructor(
        public readonly id: string,
        public readonly unit: TaskUnit,
        public readonly handler: (current: Bullet) => Promise<void>,
    ) {
        this.crontab = Cron.parse(this.unit.crontab_str, this.unit.options)
        this.execution = this.crontab.next()
    }
}
