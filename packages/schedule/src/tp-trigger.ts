/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData } from '@tarpit/config'
import { collect_unit, get_providers, Injector, TpPlugin, TpPluginType, ValueProvider } from '@tarpit/core'
import { Dora } from '@tarpit/dora'

import { TaskLifeCycle } from './__services__/task-life-cycle'
import { TaskLock } from './__services__/task-lock'
import { TpScheduleUnit, TaskDesc, TpScheduleMeta } from './__types__'
import { Bullet } from './bullet'
import { TaskContext } from './task-context'

function on_error_or_throw(hooks: TaskLifeCycle | undefined, err: any, context: TaskContext) {
    if (hooks) {
        return hooks.on_error(err, context)
    } else {
        throw err
    }
}

/**
 * TpTrigger 的触发器。
 *
 * @category Schedule
 */
@TpPluginType({ type: 'TpSchedule', loader_list: ['œœ-TpSchedule'], option_key: 'schedules' })
export class TpTrigger implements TpPlugin<'TpSchedule'> {

    private static id_cursor = 1
    private _clip?: Bullet | null
    private _suspended_task: { [id: string]: Bullet } = {}

    /**
     * @private
     * 定时器。
     */
    private _interval: NodeJS.Timeout | undefined

    constructor(
        private injector: Injector,
        private config_data: ConfigData
    ) {
        this.injector.set_provider(TaskLifeCycle, new ValueProvider('TaskLifeCycle', null))
        this.injector.set_provider(TaskLock, new ValueProvider('TaskLock', null))
    }

    private static get_id(): string {
        const id = TpTrigger.id_cursor
        TpTrigger.id_cursor++
        return `bullet-${id}`
    }

    /**
     * 停止（挂起）一个任务。
     *
     * 此操作会将任务移出触发队列，但不会停止当前正在执行的任务。
     *
     * @param id 任务 ID
     */
    async stop(id: string) {
        let bullet = this._clip
        while (bullet && bullet?.id !== id) {
            bullet = bullet.next_bullet
        }
        if (!bullet) {
            throw new Error(`No hang task found by ID: [${id}]`)
        }
        this.suspend(bullet)
    }

    /**
     * 临时触发一个任务队列中的任务。
     *
     * 此操作会先将指定的任务移出队列，执行完毕后如果没有异常会添加回队列中。
     *
     * @param id 任务 ID
     */
    async interim(id: string) {
        let bullet = this._clip
        while (bullet && bullet?.id !== id) {
            bullet = bullet.next_bullet
        }
        if (!bullet) {
            throw new Error(`No hang task found by ID: [${id}]`)
        }
        this.suspend(bullet)
        try {
            await bullet.handler()
            this.renew(bullet)
        } catch (err) {
            console.log('on error', err)
        }
    }

    /**
     * 将因为异常被移出队列的任务，添加回队列中。
     *
     * @param id 任务 ID
     * @param run_first 是否在添加之前先运行一次
     */
    async renew_task(id: string, run_first?: boolean) {
        const bullet = this._suspended_task[id]
        if (!bullet) {
            throw new Error(`No hang task found by ID: [${id}]`)
        }
        if (run_first) {
            try {
                await bullet.handler(bullet.execution)
                this.renew(bullet)
            } catch (err) {
                console.log('on error', err)
            }
        } else {
            this.renew(bullet)
        }
    }

    /**
     * 获取挂起任务列表。
     */
    get_suspended_list(): TaskDesc[] {
        return Object.values(this._suspended_task).map(bullet => {
            return {
                id: bullet.id,
                name: bullet.desc.name ?? bullet.desc.pos ?? '',
                pos: bullet.desc.pos ?? '',
                crontab: bullet.desc.crontab_str ?? '',
                next_exec_ts: bullet.execution.valueOf(),
                next_exec_date_string: bullet.execution.format(),
            }
        })
    }

    /**
     * 获取任务队列中的任务列表。
     */
    get_task_list() {
        const list: TaskDesc[] = []
        let bullet = this._clip
        while (bullet) {
            list.push({
                id: bullet.id,
                name: bullet.desc.name ?? bullet.desc.pos ?? '',
                pos: bullet.desc.pos ?? '',
                crontab: bullet.desc.crontab_str ?? '',
                next_exec_ts: bullet.execution.valueOf(),
                next_exec_date_string: bullet.execution.format(),
            })
            bullet = bullet.next_bullet
        }
        return list
    }

    load(meta: TpScheduleMeta, injector: Injector): void {
        collect_unit(meta.self, 'TpScheduleUnit').forEach(unit => {
            if (!unit.meta?.disabled) {
                const task_handler = this.make_trigger(injector, unit, [TaskContext])
                this._fill(task_handler, unit)
            }
        })
    }

    async start(): Promise<void> {
        this._interval = setInterval(() => {
            this._shoot(Date.now())
        }, 100)
    }

    async destroy() {
        if (this._interval) {
            clearInterval(this._interval)
        }
        return
    }

    /**
     * @private
     */
    private _fill(handler: Function, desc: TpScheduleUnit<any>) {
        const bullet = new Bullet(TpTrigger.get_id(), handler, desc)
        if (!this._clip) {
            this._clip = bullet
        } else if (bullet.execution < this._clip.execution) {
            bullet.next_bullet = this._clip
            this._clip = bullet
        } else {
            this.insert(this._clip, bullet)
        }
    }

    /**
     * @private
     */
    private _shoot(timestamp: number) {
        if (!this._clip) {
            return
        }
        while (this._clip.execution.valueOf() <= timestamp) {
            this.execute()
        }
    }

    /**
     * 重启一个任务
     *
     * @param bullet
     * @private
     */
    private renew(bullet: Bullet) {
        delete this._suspended_task[bullet.id]
        const now = Date.now()
        while (bullet.execution.valueOf() < now) {
            bullet.execution = bullet.crontab.next()
        }
        if (!this._clip) {
            this._clip = bullet
        } else if (bullet.execution.valueOf() < this._clip.execution.valueOf()) {
            bullet.next_bullet = this._clip
            this._clip = bullet
        } else {
            this.insert(this._clip, bullet)
        }
    }

    /**
     * 挂起一个任务。
     *
     * @param clip
     * @private
     */
    private suspend(clip: Bullet) {
        if (!this._clip) {
            return
        } else if (this._clip === clip) {
            this._clip = clip.next_bullet
            this._suspended_task[clip.id] = clip
        } else {
            this.remove(this._clip, clip)
            this._suspended_task[clip.id] = clip
        }
    }

    /**
     * 执行一个任务。
     *
     * @private
     */
    private execute() {
        if (!this._clip) {
            return
        }
        const execution = this._clip.execution
        this._clip.execution = this._clip.crontab.next()
        const clip = this._clip
        this._clip.handler(execution).catch((err: any) => {
            console.log('on error', err)
            this.suspend(clip)
        })
        if (this._clip.next_bullet && this._clip.next_bullet.execution.valueOf() < this._clip.execution.valueOf()) {
            const bullet = this._clip
            this._clip = bullet.next_bullet!
            bullet.next_bullet = null
            this.insert(this._clip, bullet)
        }
    }

    /**
     * 插入一个任务。
     *
     * @param clip
     * @param bullet
     * @private
     */
    private insert(clip: Bullet, bullet: Bullet) {
        if (!clip.next_bullet) {
            clip.next_bullet = bullet
        } else if (bullet.execution.valueOf() < clip.next_bullet.execution.valueOf()) {
            bullet.next_bullet = clip.next_bullet
            clip.next_bullet = bullet
        } else {
            this.insert(clip.next_bullet, bullet)
        }
    }

    /**
     * 移除一个任务。
     *
     * @param clip
     * @param bullet
     * @private
     */
    private remove(clip: Bullet, bullet: Bullet) {
        if (!clip.next_bullet) {
            return
        } else if (clip.next_bullet === bullet) {
            clip.next_bullet = bullet.next_bullet
            bullet.next_bullet = null
            return
        } else {
            this.remove(clip.next_bullet, bullet)
        }
    }

    private make_trigger(injector: Injector, desc: TpScheduleUnit<any>, except_list?: any[]) {

        const provider_list = get_providers(desc, injector, except_list)

        return async function(execution?: Dora) {
            const hooks = injector.get(TaskLifeCycle)?.create()
            const task_lock = injector.get(TaskLock)?.create()
            if (desc.lock_key && !task_lock) {
                throw new Error(`Decorator "@Lock" is settled on ${desc.pos}, but there's no "TaskLock" implements found.`)
            }

            if (!desc.crontab_str) {
                throw new Error()
            }

            const context = new TaskContext({
                name: desc.name ?? desc.pos ?? '',
                execution: execution ?? Dora.now(),
                pos: desc.pos!,
                property_key: desc.property,
                crontab: desc.crontab_str,
                temp_exec: !!execution,
                lock_key: desc.lock_key,
                lock_expires: desc.lock_expires,
            })

            await hooks?.on_init(context)
            const param_list = provider_list.map((provider: any) => {
                if (provider === undefined) {
                    return undefined
                } else if (provider === TaskContext) {
                    return context
                } else {
                    return provider.create()
                }
            })

            if (task_lock && desc.lock_key) {
                const locked = await task_lock.lock(desc.lock_key ?? desc.pos, context)
                if (locked !== undefined) {
                    const lock_key = desc.lock_key
                    return desc.handler(...param_list)
                        .then((res: any) => hooks?.on_finish(res, context))
                        .catch((err: any) => on_error_or_throw(hooks, err, context))
                        .finally(() => task_lock.unlock(lock_key, locked, context))
                } else {
                    await task_lock.on_lock_failed(context)
                }
            } else {
                return desc.handler(...param_list)
                    .then((res: any) => hooks?.on_finish(res, context))
                    .catch((err: any) => on_error_or_throw(hooks, err, context))
            }
        }
    }
}
