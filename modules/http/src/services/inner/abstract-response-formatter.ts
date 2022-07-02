/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { HttpResponseType } from '../../__types__'
import { HttpContext } from '../../builtin'

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
export abstract class AbstractResponseFormatter {

    /**
     * 实现具体的包装逻辑。
     *
     * 如果返回 undefined 表示不对结果进行封装，直接返回原处理结果。
     *
     * **注意**：只有请求处理正常执行完毕才会调用 wrap 方法。
     *
     * @param context
     * @param result 请求处理函数的结果
     * @return real_result 实际需要写入请求连接的响应内容。
     */
    abstract format(context: HttpContext, result: any): HttpResponseType
}
