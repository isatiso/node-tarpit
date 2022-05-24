/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Dora } from '@tarpit/dora'
import { TpScheduleUnit } from './__types__'
import { Crontab } from './crontab'

export class Bullet {

    public crontab: Crontab
    public execution: Dora
    public next_bullet: Bullet | null = null

    constructor(
        public id: string,
        public handler: Function,
        public desc: TpScheduleUnit<any>,
    ) {
        if (!desc.us_crontab_str) {
            throw new Error()
        }
        this.crontab = Crontab.parse(desc.us_crontab_str, desc.us_task_options)
        this.execution = this.crontab.next()
    }
}
