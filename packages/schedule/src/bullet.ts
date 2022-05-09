/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Dora } from '@tarpit/dora'
import { ScheduleFunction } from './__type__'
import { Crontab } from './crontab'

export class Bullet {

    public crontab: Crontab
    public execution: Dora
    public next_bullet: Bullet | null = null

    constructor(
        public id: string,
        public handler: Function,
        public desc: ScheduleFunction<any>,
    ) {
        if (!desc.crontab_str) {
            throw new Error()
        }
        this.crontab = Crontab.parse(desc.crontab_str, desc.task_options)
        this.execution = this.crontab.next()
    }
}
