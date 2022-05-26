/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { SessionContext } from '../builtin/session-context'

/**
 * 请求处理生命周期接口，通过实现抽象类，在请求处理的开始，结束和异常时做相应操作。
 *
 * @category Abstract Service
 */
export abstract class AbstractLifeCycle {

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
