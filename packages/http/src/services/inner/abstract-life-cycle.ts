/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { HttpContext } from '../../builtin'
import { TpHttpError } from '../../errors'

/**
 * 请求处理生命周期接口，通过实现抽象类，在请求处理的开始，结束和异常时做相应操作。
 *
 * @category Abstract Service
 */
export abstract class AbstractLifeCycle {

    /**
     * 请求初始化之后，进行依赖查找之前调用。
     *
     * @param ctx
     */
    abstract on_init(ctx: HttpContext): Promise<void>

    /**
     * 请求处理结束，向连接写入响应数据之前调用。
     *
     * @param ctx
     * @param res
     */
    abstract on_finish(ctx: HttpContext, res: any): Promise<void>

    /**
     * 请求处理异常，向连接写入响应数据之前调用。
     *
     * @param ctx
     * @param err
     */
    abstract on_error(ctx: HttpContext, err: TpHttpError): Promise<void>

}
