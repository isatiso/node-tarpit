/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData } from '@tarpit/config'
import { SymbolToken, TpService } from '@tarpit/core'
import { HttpResponseType } from '../__types__'
import { HttpContext } from '../builtin'
import { TpHttpError } from '../errors'
import { HTTP_STATUS } from '../tools/http-status'

@SymbolToken('http')
@TpService({ inject_root: true })
export class HttpErrorFormatter {

    private expose = this.config_data.get('http.expose_error') ?? false

    constructor(
        private config_data: ConfigData,
    ) {
    }

    format(context: HttpContext, err: TpHttpError): HttpResponseType {
        return { error: this.expose ? err.jsonify() : { code: err.code, msg: HTTP_STATUS.message_of(err.status) } }
    }
}
