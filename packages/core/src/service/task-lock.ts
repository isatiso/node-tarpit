/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TaskContext } from '../schedule'

/**
 * 任务的加锁服务接口。
 *
 * 当包含任务的服务需要多实例运行时，有些任务可能同时只需要运行一次，此时你可能需要一个加锁服务，来保证任务不会重复执行。
 *
 * @category Abstract Service
 */
export abstract class TaskLock {

    /**
     * 加锁接口。
     *
     * - 返回 undefined 表示加锁失败。
     * - 其余情况表示加锁成功，继而执行任务。之后会将返回值传递到 [[TaskLock.unlock]] 进行解锁。
     *
     * @param key 通过 [[Tp.Lock]] 设置的 key。
     * @param context 任务上下文对象。
     * @return 普通状况下直接使用 key 进行加锁和解锁。如果有更高的安全需求，可以生成 secret 来避免错误解锁。
     */
    abstract lock(key: string, context: TaskContext): Promise<string | boolean | null | undefined>

    /**
     * 解锁接口。
     *
     * @param key 通过 [[Tp.Lock]] 设置的 key。
     * @param secret [[TaskLock.lock]] 的执行结果。
     * @param context 任务上下文对象。
     */
    abstract unlock(key: string, secret: string | boolean | null | undefined, context: TaskContext): Promise<void>

    /**
     * 对于加锁失败的情况，会触发这个函数。
     *
     * @param context 任务上下文对象。
     */
    abstract on_lock_failed(context: TaskContext): Promise<void>
}
