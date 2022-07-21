/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Cron } from '@tarpit/cron'
import { TaskUnit } from '../tools/collect-tasks'

export class Bullet {

    public crontab = Cron.parse(this.unit.crontab_str, this.unit.options)
    public execution = this.crontab.next()
    public next_bullet: Bullet | undefined = undefined

    constructor(
        public readonly id: string,
        public readonly unit: TaskUnit,
        public readonly handler: (current: Bullet) => Promise<void>,
    ) {
    }
}
