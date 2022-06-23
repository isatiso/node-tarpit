/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '@tarpit/core'
import { HttpResponseType } from '../../__types__'
import { HttpContext } from '../../builtin'
import { TpHttpError } from '../../errors'
import { HTTP_STATUS } from '../../tools/http-status'
import { AbstractResponseFormatter } from '../inner/abstract-response-formatter'

@TpService({ inject_root: true })
export class TpErrorFormatter extends AbstractResponseFormatter {

    static format(context: HttpContext, err: TpHttpError): HttpResponseType {
        return { error: err.expose ? err.jsonify() : { code: err.code, msg: HTTP_STATUS.message_of(err.status) } }
    }

    format(context: HttpContext, err: TpHttpError): HttpResponseType {
        // return TpErrorFormatter.format(context, err)
        return { error: err.jsonify() }
    }
}
