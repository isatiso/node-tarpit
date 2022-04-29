/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Dora } from '../builtin'
import { TriggerFunction } from '../core'
import { Schedule } from './schedule'

export class Bullet {

    public crontab: Schedule
    public execution: Dora
    public next_bullet: Bullet | null = null

    constructor(
        public id: string,
        public handler: Function,
        public desc: TriggerFunction<any>,
    ) {
        if (!desc.crontab) {
            throw new Error()
        }
        this.crontab = Schedule.parse(desc.crontab, desc.schedule_options)
        this.execution = this.crontab.next()
    }
}
