/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { HttpResponseType } from '../../__types__'
import { HttpContext } from '../../builtin'
import { TpHttpError } from '../../errors'

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
export abstract class AbstractErrorFormatter {

    /**
     * 实现异常地处理逻辑。
     *
     * 如果返回 undefined 则会使用默认的异常结构。
     *
     * @param context
     * @param err
     * @return real_result 实际需要写入请求连接的响应内容。
     */
    abstract format<T = any>(context: HttpContext, err: TpHttpError): HttpResponseType
}
