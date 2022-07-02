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
import { AbstractResponseFormatter } from '../inner/abstract-response-formatter'

@TpService({ inject_root: true })
export class TpResponseFormatter extends AbstractResponseFormatter {

    format(context: HttpContext, result: any): HttpResponseType {
        return result
    }
}
