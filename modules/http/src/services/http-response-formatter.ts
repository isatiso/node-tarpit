/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '@tarpit/core'
import { HttpResponseType } from '../__types__'
import { HttpContext } from '../builtin'

@TpService({ inject_root: true })
export class HttpResponseFormatter {

    format(context: HttpContext, result: any): HttpResponseType {
        return result
    }
}
