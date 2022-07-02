/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TriggerContext } from '../../builtin/trigger-context'

/**
 * [[Trigger.Task]] 的生命周期服务。和 [[Tora.ToraRouter]] 的 AbstractHttpHooks 接口一样，用于在任务执行的几个特定时间点触发一些操作。
 *
 * 需要注意的时，如果实现了 AbstractTaskHooks 接口，异常会被捕获并传入 on_error 方法。
 * 如果此时不需要处理异常，需要将异常抛出。
 *
 * 如果 Task 执行过程中遇到了未处理的异常，异常任务会被移出执行队列。
 *
 * **注意**：对于实现了 AbstractSafety 服务，但是获取锁失败的情况不会触发 AbstractTaskHooks 中的任何方法。请参考 [[AbstractSafety]]。
 *
 * @category Abstract Service
 */
export abstract class AbstractTriggerHooks {

    /**
     * 请求初始化之后，进行依赖查找之前调用。
     *
     * @param context 任务上下文对象。
     */
    abstract on_init(context: TriggerContext): Promise<void>

    /**
     * 任务正常执行结束。
     *
     * @param res
     * @param context 任务上下文对象。
     */
    abstract on_finish<T>(context: TriggerContext, res: T): Promise<void>

    /**
     * 任务抛出异常。
     *
     * @param err
     * @param context 任务上下文对象。
     */
    abstract on_error(context: TriggerContext, err: any): Promise<void>
}
