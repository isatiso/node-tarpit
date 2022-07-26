/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '@tarpit/core'
import { TpSchedule } from '../annotations'
import { Bullet } from '../builtin/bullet'
import { TaskUnit } from '../tools/collect-tasks'
import { make_task } from '../tools/make-task'

@TpService({ inject_root: true })
export class ScheduleHub {

    public next_bullet: Bullet | undefined
    public suspended = new Map<string, Bullet>()
    private id_cursor = 1

    load(unit: TaskUnit, meta: TpSchedule) {
        this._insert(new Bullet(this._get_id(), unit, make_task(meta.injector!, unit)))
    }

    shoot(timestamp: number) {
        while (this.next_bullet && this.next_bullet.execution.valueOf() <= timestamp) {
            this.execute(this.next_bullet.id).then()
        }
    }

    suspend(id: string): Bullet | undefined {
        const task = this._remove(id)
        if (task) {
            this.suspended.set(task.id, task)
        }
        return task
    }

    reload(id: string): Bullet | undefined {
        const task = this.suspended.get(id)
        if (task) {
            const now = Date.now()
            while (task.execution.valueOf() < now) {
                task.execution = task.crontab.next()
            }
            this.suspended.delete(id)
            this._insert(task)
        }
        return task
    }

    execute(id: string): Promise<Bullet | void> {
        const task = this.suspend(id)
        if (task) {
            return task.handler(task)
                .then(() => task.execution = task.crontab.next())
                .then(() => this.reload(task.id))
        }
        return Promise.resolve()
    }

    private _get_id(): string {
        const id = this.id_cursor
        this.id_cursor++
        return `bullet-${id}`
    }

    private _insert(task: Bullet): Bullet {
        let magazine: { next_bullet?: Bullet } = this
        while (magazine.next_bullet && task.execution.valueOf() > magazine.next_bullet.execution.valueOf()) {
            magazine = magazine.next_bullet
        }
        if (magazine.next_bullet) {
            task.next_bullet = magazine.next_bullet
        }
        magazine.next_bullet = task
        return task
    }

    private _remove(id: string): Bullet | undefined {
        let magazine: { next_bullet?: Bullet } = this
        while (magazine.next_bullet && magazine.next_bullet.id !== id) {
            magazine = magazine.next_bullet
        }
        const task = magazine.next_bullet
        if (!task?.next_bullet) {
            magazine.next_bullet = undefined
        } else {
            magazine.next_bullet = task.next_bullet
            task.next_bullet = undefined
        }
        return task
    }
}
