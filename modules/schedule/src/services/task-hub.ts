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
import { TaskUnit } from '../tools'
import { Clerk } from './clerk'

@TpService({ inject_root: true })
export class TaskHub {

    private static id_cursor = 1

    public next_bullet?: Bullet
    public suspended = new Map<string, Bullet>()

    constructor(
        private clerk: Clerk,
    ) {
    }

    private static get_id(): string {
        const id = TaskHub.id_cursor
        TaskHub.id_cursor++
        return `bullet-${id}`
    }

    load(unit: TaskUnit, meta: TpSchedule) {
        const handler = this.clerk.make_task(meta.injector!, unit)
        this._insert(new Bullet(TaskHub.get_id(), handler, unit))
    }

    shoot(timestamp: number) {
        while (this.next_bullet && this.next_bullet.execution.valueOf() <= timestamp) {
            this._execute(this.next_bullet.id).then()
        }
    }

    async cancel(id: string) {
        const task = this._suspend(id)
        if (!task) {
            throw new Error(`No hang task found by ID: [${id}]`)
        }
    }

    async run(id: string) {
        await this._execute(id)
    }

    async reload(id: string, run_first?: boolean): Promise<Bullet | void> {
        const task = this.suspended.get(id)
        if (task) {
            if (run_first) {
                return this._reload(task.id)
            } else {
                return task.handler(task.execution, task)
                    .then(() => task.execution = task.crontab.next())
                    .then(() => this._reload(task.id))
                    .catch((err: any) => console.log('on error', err))
            }
        }
    }

    private _execute(id: string): Promise<Bullet | void> {
        const task = this._suspend(id)
        if (task) {
            return task.handler(task.execution, task)
                .then(() => task.execution = task.crontab.next())
                .then(() => this._reload(task.id))
                .catch((err: any) => console.log('on error', err))
        }
        return Promise.resolve()
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

    private _suspend(id: string): Bullet | undefined {
        const task = this._remove(id)
        if (task) {
            this.suspended.set(task.id, task)
        }
        return task
    }

    private _reload(id: string): Bullet | undefined {
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
}
