/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData } from '@tarpit/config'
import { TpService } from '@tarpit/core'
import { HttpResponseType } from '../__types__'
import { HttpContext } from '../builtin'
import { HTTP_STATUS } from '../tools/http-status'

@TpService({ inject_root: true })
export class HttpBodyFormatter {

    private expose = this.config_data.get('http.expose_error') ?? false

    constructor(
        private config_data: ConfigData,
    ) {
    }

    format(context: HttpContext): HttpResponseType | undefined {
        if (context.result.status >= 400) {
            const preferred_media_type = context.request.accepts.preferred_media_types(['application/json', 'text/html', 'text/plain'])[0]
            if (preferred_media_type === 'application/json') {
                return { error: this.expose ? context.result.jsonify() : { code: context.result.code, msg: HTTP_STATUS.message_of(context.result.status) } }
            } else if (preferred_media_type === 'text/html') {
                // TODO: support html
                return context.result.message
            } else {
                return context.result.message
            }
        } else {
            return context.result.body
        }
    }
}
