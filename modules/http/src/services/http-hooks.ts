/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '@tarpit/core'
import { Dora } from '@tarpit/dora'
import { HttpContext, TpRequest, TpWebSocket } from '../builtin'

function time_str() {
    return Dora.now().format('YYYY-MM-DDTHH:mm:ssZZ')
}

export function write_log(time_str: string, ip: string, duration: string, method: string, status: string, path: string, err_msg?: string) {
    console.info(`[${time_str}]${ip.padEnd(18)} ${duration.padStart(8)} ${method.padEnd(7)} ${status.padEnd(4)}`, path, err_msg)
}

export function assemble_duration(context: HttpContext) {
    const start = context.get('process_start')
    const duration = start ? Date.now() - start : -1
    context.response.set('X-Duration', duration)
    return duration
}

export function create_request_log(context: HttpContext, duration: number) {
    const err_msg = context.response.status >= 400 ? `<${context.result.code} ${context.result.msg}>` : ''
    write_log(time_str(), context.request.ip, `${duration}ms`, context.request.method ?? '-', context.response.status + '', context.request.path ?? '-', err_msg)
    if (context.response.status === 500) {
        console.info(context.result.origin)
    }
}

@TpService({ inject_root: true })
export class HttpHooks {

    async on_init(context: HttpContext): Promise<void> {
        context.set('process_start', Date.now())
    }

    async on_finish(context: HttpContext): Promise<void> {
        const duration = assemble_duration(context)
        create_request_log(context, duration)
    }

    async on_error(context: HttpContext): Promise<void> {
        const duration = assemble_duration(context)
        create_request_log(context, duration)
    }

    async on_ws_init(socket: TpWebSocket, req: TpRequest) {
        write_log(time_str(), req.ip, 'OPEN', 'SOCKET', '-', req.path ?? '-')
    }

    async on_ws_close(socket: TpWebSocket, req: TpRequest, code: number) {
        write_log(time_str(), req.ip, 'CLOSE', 'SOCKET', code + '', req.path ?? '-')
    }
}
