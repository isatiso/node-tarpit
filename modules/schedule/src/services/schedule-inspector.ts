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
import { ScheduleHub } from './schedule-hub'

function map_bullet(bullet: Bullet) {
    return {
        id: bullet.id,
        name: bullet.unit.task_name,
        pos: bullet.unit.position,
        crontab: bullet.unit.crontab_str,
        next_exec_ts: bullet.execution.valueOf(),
        next_exec_date_string: bullet.execution.format(),
    }
}

@TpService({ inject_root: true })
export class ScheduleInspector {

    constructor(
        private hub: ScheduleHub
    ) {
    }

    get_task(id: string): TaskDesc | undefined {
        let cursor: { next_bullet?: Bullet } = this.hub
        while (cursor.next_bullet) {
            if (cursor.next_bullet.id === id) {
                return map_bullet(cursor.next_bullet)
            }
            cursor = cursor.next_bullet
        }
    }

    get_suspended_task(id: string): TaskDesc | undefined {
        const bullet = this.hub.suspended.get(id)
        if (bullet) {
            return map_bullet(bullet)
        }
    }

    list_suspended(): TaskDesc[] {
        return Array.from(this.hub.suspended.values()).map(task => ({
            id: task.id,
            name: task.unit.task_name,
            pos: task.unit.position,
            crontab: task.unit.crontab_str,
            next_exec_ts: task.execution.valueOf(),
            next_exec_date_string: task.execution.format(),
        }))
    }

    list_task() {
        const list: TaskDesc[] = []
        let cursor: { next_bullet?: Bullet } = this.hub
        while (cursor.next_bullet) {
            list.push({
                id: cursor.next_bullet.id,
                name: cursor.next_bullet.unit.task_name,
                pos: cursor.next_bullet.unit.position,
                crontab: cursor.next_bullet.unit.crontab_str,
                next_exec_ts: cursor.next_bullet.execution.valueOf(),
                next_exec_date_string: cursor.next_bullet.execution.format(),
            })
            cursor = cursor.next_bullet
        }
        return list
    }

    async cancel(id: string) {
        this.hub.suspend(id)
    }

    async run(id: string) {
        await this.hub.execute(id)
    }

    async reload(id: string, run_first?: boolean): Promise<Bullet | void> {
        if (run_first) {
            const task = this.hub.suspended.get(id)
            if (task) {
                return task.handler(task)
                    .then(() => task.execution = task.crontab.next())
                    .then(() => this.hub.reload(task.id))
            }
        } else {
            return this.hub.reload(id)
        }
    }
}
