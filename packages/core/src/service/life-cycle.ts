/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { SessionContext } from '../http'

/**
 * 请求处理生命周期接口，通过实现抽象类，在请求处理的开始，结束和异常时做相应操作。
 *
 * @category Abstract Service
 */
export abstract class LifeCycle {

    /**
     * 请求初始化之后，进行依赖查找之前调用。
     *
     * @param context
     */
    abstract on_init(context: SessionContext): Promise<void>

    /**
     * 请求处理结束，向连接写入响应数据之前调用。
     *
     * @param context
     */
    abstract on_finish(context: SessionContext): Promise<void>

    /**
     * 请求处理异常，向连接写入响应数据之前调用。
     *
     * @param context
     * @param err
     */
    abstract on_error(context: SessionContext, err: any): Promise<void>

}
