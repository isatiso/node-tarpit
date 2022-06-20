/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '@tarpit/core'
import { TaskDesc } from '../__types__'
import { Bullet } from '../builtin/bullet'
import { TaskHub } from './task-hub'

@TpService()
export class ScheduleInspector {

    constructor(
        private task_hub: TaskHub
    ) {
    }

    list_suspended(): TaskDesc[] {
        return Array.from(this.task_hub.suspended.values()).map(task => ({
            id: task.id,
            name: task.unit.task_name ?? task.unit.position ?? '',
            pos: task.unit.position ?? '',
            crontab: task.unit.crontab_str ?? '',
            next_exec_ts: task.execution.valueOf(),
            next_exec_date_string: task.execution.format(),
        }))
    }

    list_bullet() {
        const list: TaskDesc[] = []
        let cursor: { next_bullet?: Bullet } = this.task_hub
        while (cursor.next_bullet) {
            list.push({
                id: cursor.next_bullet.id,
                name: cursor.next_bullet.unit.task_name ?? cursor.next_bullet.unit.position ?? '',
                pos: cursor.next_bullet.unit.position ?? '',
                crontab: cursor.next_bullet.unit.crontab_str ?? '',
                next_exec_ts: cursor.next_bullet.execution.valueOf(),
                next_exec_date_string: cursor.next_bullet.execution.format(),
            })
            cursor = cursor.next_bullet
        }
        return list
    }
}
