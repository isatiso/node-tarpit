/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { AsyncResource } from 'async_hooks'
import { EventEmitter } from 'events'
import { isMainThread, parentPort, Worker } from 'worker_threads'
import { TpService } from '../annotations'
import { Injector } from '../di'
import { TarpitId } from '../tools/decorator'
import { Constructor } from '../types'
import { TpThreadStrategy } from './tp-thread-strategy'

const worker_freed_event = Symbol('worker_freed_event')

export interface WorkerDescription {
    task?: TaskInfo<any>
    ins: Worker
}

type MethodOfClass<T> = { [K in keyof T]: T[K] extends (...args: any) => any ? K : never }[keyof T]

export interface TaskDescription {
    tarpit_id: string
    method: string
    args: any[]
    callback: (err: any, result: any) => void
}

export class TaskInfo<T> extends AsyncResource {
    constructor(private callback: (err: any, result: T) => void) {
        super('TaskInfo')
    }

    done(err: any, result: T) {
        this.runInAsyncScope(this.callback, null, err, result)
        this.emitDestroy()
    }
}

@TpService()
export class TpThread extends EventEmitter {

    private workers: WorkerDescription[] = []
    private free_workers: WorkerDescription[] = []
    private task_buffer: TaskDescription[] = []

    constructor(
        private strategy: TpThreadStrategy,
        private injector: Injector,
    ) {
        super()
        this.injector.on('start', () => this.start())
        this.injector.on('terminate', () => this.terminate())
        if (parentPort) {
            parentPort.on('message', async message => {
                const { tarpit_id, method, args } = message
                const instance: any = this.injector.get_id(tarpit_id)?.create()
                try {
                    const result = await instance?.[method]?.(...args)
                    parentPort!.postMessage({ result })
                } catch (err) {
                    parentPort!.postMessage({ error: JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err))) })
                }
            })
        }
    }

    async run_task<T extends object, K extends MethodOfClass<T>>(
        cls: Constructor<T>, method: K & string, ...args: Parameters<T[K]>
    ): Promise<ReturnType<T[K]> extends Promise<infer R> ? R : ReturnType<T[K]>> {
        const tarpit_id = (cls as any)[TarpitId]
        if (typeof tarpit_id !== 'string') {
            throw new Error(`${cls.name} is not a TpComponent`)
        }
        if (isMainThread) {
            return new Promise((resolve, reject) => {
                this._run_task({ tarpit_id, method, args, callback: (err, result) => err ? reject(err) : resolve(result) })
            })
        } else {
            const instance: any = this.injector.get_id(tarpit_id)?.create()
            const result = await instance?.[method]?.(...args)
            return Promise.resolve(result)
        }
    }

    start() {
        if (isMainThread) {
            for (let i = 0; i < this.strategy.max_threads; i++) {
                this._add_new_worker()
            }
            this.on(worker_freed_event, () => {
                if (this.task_buffer.length) {
                    this._run_task(this.task_buffer.shift()!)
                }
            })
        }
    }

    terminate() {
        for (const worker of this.workers) {
            worker.ins.terminate().then()
        }
    }

    private _run_task(task: TaskDescription) {
        const worker = this.free_workers.pop()
        if (!worker) {
            this.task_buffer.push(task)
        } else {
            const { callback, ...other } = task
            worker.task = new TaskInfo(callback)
            worker.ins.postMessage({ ...other })
        }
    }

    private _add_new_worker() {
        const worker: WorkerDescription = { ins: new Worker(require?.main?.filename ?? '') }
        worker.ins.on('message', msg => {
            worker.task?.done(msg.error, msg.result)
            worker.task = undefined
            this.free_workers.push(worker)
            this.emit(worker_freed_event)
        })
        worker.ins.on('error', err => {
            worker.task?.done(err, null)
            this.workers.splice(this.workers.indexOf(worker), 1)
            this._add_new_worker()
        })
        this.workers.push(worker)
        this.free_workers.push(worker)
        this.emit(worker_freed_event)
    }
}
