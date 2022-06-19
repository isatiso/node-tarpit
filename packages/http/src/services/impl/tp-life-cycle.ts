/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '@tarpit/core'
import { Dora } from '@tarpit/dora'
import { HttpContext } from '../../builtin'
import { BusinessError, CrashError, StandardError, TpHttpError } from '../../errors'
import { AbstractLifeCycle } from '../inner/abstract-life-cycle'

function assemble_duration(context: HttpContext) {
    const start = context.get('process_start')
    const duration = start ? Date.now() - start : -1
    context.res.setHeader('Process-Duration', duration)
    return duration
}

function log(context: HttpContext, duration: number, err?: TpHttpError) {
    const time_str = Dora.now().format('YYYY-MM-DDTHH:mm:ssZZ')
    const ip = context.request.ip.padEnd(18)
    const duration_str = `${duration}ms`.padStart(8)
    const method_str = (context.req.method ?? '-').padEnd(7)
    if (err instanceof BusinessError) {
        const type = 'business '
        const err_msg = `<${err.code} ${err.msg}>`
        console.log(`[${time_str}]${ip} ${duration_str} ${method_str} ${type}`, context.request.path, err_msg)
    } else if (err instanceof CrashError) {
        const type = 'crash    '
        const err_msg = `<${err.code} ${err.msg}> ${err.stack ?? ''}`
        console.log(`[${time_str}]${ip} ${duration_str} ${method_str} ${type}`, context.request.path, err_msg)
    } else if (err instanceof StandardError) {
        const type = 'standard '
        const err_msg = `<${err.status} ${err.msg}> ${err.stack ?? ''}`
        console.log(`[${time_str}]${ip} ${duration_str} ${method_str} ${type}`, context.request.path, err_msg)
    } else {
        const type = 'success  '
        console.log(`[${time_str}]${ip} ${duration_str} ${method_str} ${type}`, context.request.path)
    }
}

@TpService()
export class TpLifeCycle extends AbstractLifeCycle {

    /**
     * 请求到达 API 处理函数时触发
     */
    async on_init(context: HttpContext): Promise<void> {
        context.set('process_start' as any, Date.now())
    }

    /**
     * API 处理结束时触发
     */
    async on_finish(context: HttpContext, res: any): Promise<void> {
        const duration = assemble_duration(context)
        log(context, duration)
    }

    /**
     * API 处理异常时触发
     */
    async on_error(context: HttpContext, err: TpHttpError): Promise<void> {
        const duration = assemble_duration(context)
        log(context, duration, err)
    }
}
