import { AsyncResource } from 'async_hooks'
import { EventEmitter } from 'events'
import { isMainThread, parentPort, Worker } from 'worker_threads'
import { Constructor } from './types'

const worker_freed_event = Symbol('worker_freed_event')

export interface WorkerDescription {
    task?: TaskInfo<any>
    ins: Worker
}

export interface TaskDescription<T extends (Function & ((...args: any) => any))> {
    name: T['name']
    args: Parameters<T>
    callback: (err: any, result: ReturnType<T>) => void
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

export class WorkerThread<T extends Record<string, (Function & ((...args: any) => any))> = {}> extends EventEmitter {

    private workers: WorkerDescription[] = []
    private free_workers: WorkerDescription[] = []
    private task_buffer: TaskDescription<any>[] = []
    private _functions: any = {}

    constructor(
        private max_threads: number
    ) {
        super()
        if (isMainThread) {
            for (let i = 0; i < max_threads; i++) {
                this._add_new_worker()
            }
            this.on(worker_freed_event, () => {
                if (this.task_buffer.length) {
                    this._run_task(this.task_buffer.shift()!)
                }
            })
        } else if (parentPort) {
            parentPort.on('message', async message => {
                const { name, args } = message
                const result = await this._functions[name]?.(...args)
                parentPort!.postMessage(result)
            })
        }
    }

    async run_task<K extends keyof T>(cls: Constructor<T>, name: K, ...args: Parameters<T[K]>): Promise<ReturnType<T[K]>> {

        return new Promise((resolve, reject) => {
            this._run_task({ name, args, callback: (err, result) => err ? reject(err) : resolve(result) })
        })
    }

    close() {
        for (const worker of this.workers) {
            worker.ins.terminate().then()
        }
    }

    private _run_task(task: TaskDescription<any>) {
        if (!this.free_workers.length) {
            this.task_buffer.push(task)
        } else {
            const worker = this.free_workers.pop()!
            const { name, args, callback } = task
            worker.task = new TaskInfo(callback)
            worker.ins.postMessage({ name, args })
        }
    }

    private _add_new_worker() {
        const worker: WorkerDescription = { ins: new Worker(__filename) }
        worker.ins.on('message', result => {
            worker.task?.done(null, result)
            worker.task = undefined
            this.free_workers.push(worker)
            this.emit(worker_freed_event)
        })
        worker.ins.on('error', err => {
            if (worker.task) {
                worker.task?.done(err, null)
            } else {
                this.emit('error', err)
            }
            this.workers.splice(this.workers.indexOf(worker), 1)
            this._add_new_worker()
        })
        this.workers.push(worker)
        this.free_workers.push(worker)
        this.emit(worker_freed_event)
    }
}
