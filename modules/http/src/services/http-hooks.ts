/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '@tarpit/core'
import { Dora } from '@tarpit/dora'
import { HttpContext, TpRequest } from '../builtin'
import { BusinessError, CrashError, StandardError, TpHttpError } from '../errors'

export function assemble_duration(context: HttpContext) {
    const start = context.get('process_start')
    const duration = start ? Date.now() - start : -1
    context.response.set('X-Duration', duration)
    return duration
}

export function create_log(request: TpRequest, duration: number, err?: TpHttpError) {
    const time_str = Dora.now().format('YYYY-MM-DDTHH:mm:ssZZ')
    const ip = request.ip.padEnd(18)
    const duration_str = `${duration}ms`.padStart(8)
    const method_str = (request.method ?? '-').padEnd(7)
    if (err instanceof BusinessError) {
        const type = 'business '
        const err_msg = `<${err.code} ${err.msg}>`
        console.log(`[${time_str}]${ip} ${duration_str} ${method_str} ${type}`, request.path, err_msg)
    } else if (err instanceof CrashError) {
        const type = 'crash    '
        const err_msg = `<${err.code} ${err.msg}>`
        console.log(`[${time_str}]${ip} ${duration_str} ${method_str} ${type}`, request.path, err_msg)
    } else if (err instanceof StandardError) {
        const type = 'standard '
        const err_msg = `<${err.status} ${err.msg}>`
        console.log(`[${time_str}]${ip} ${duration_str} ${method_str} ${type}`, request.path, err_msg)
    } else {
        const type = 'success  '
        console.log(`[${time_str}]${ip} ${duration_str} ${method_str} ${type}`, request.path)
    }
}

@TpService({ inject_root: true })
export class HttpHooks {

    async on_init(context: HttpContext): Promise<void> {
        context.set('process_start', Date.now())
    }

    async on_finish(context: HttpContext, res: any): Promise<void> {
        const duration = assemble_duration(context)
        create_log(context.request, duration)
    }

    async on_error(context: HttpContext, err: TpHttpError): Promise<void> {
        const duration = assemble_duration(context)
        create_log(context.request, duration, err)
    }
}
