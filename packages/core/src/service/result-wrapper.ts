/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { KoaResponseType, SessionContext } from '../http'

/**
 * 请求处理结果包装服务。
 *
 * 一般情况下，一个服务的多个 API 的处理结果会约定一个固定的格式，实现此服务可以统一进行格式处理。
 *
 * 比如：
 *
 * - 在请求结果外面包装一层 JSON 对象。
 * - 将结果转为 Base64 编码，此时可能需要通过 context 修改 response header。
 *
 * @category Abstract Service
 */
export abstract class ResultWrapper {

    /**
     * 实现具体的包装逻辑。
     *
     * 如果返回 undefined 表示不对结果进行封装，直接返回原处理结果。
     *
     * **注意**：只有请求处理正常执行完毕才会调用 wrap 方法。
     *
     * @param result 请求处理函数的结果
     * @param context 请求上下文对象
     * @return real_result 实际需要写入请求连接的响应内容。
     */
    abstract wrap(result: any, context: SessionContext): KoaResponseType | undefined

    /**
     * 实现异常的处理逻辑。
     *
     * 如果返回 undefined 则会使用默认的异常结构。
     *
     * @param err
     * @param context 请求上下文对象
     * @return real_result 实际需要写入请求连接的响应内容。
     */
    abstract wrap_error<T = any>(err: T, context: SessionContext): KoaResponseType | undefined
}
