/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { SymbolToken } from '@tarpit/core'
import { IncomingHttpHeaders } from 'http'
import { HttpDict } from './http-dict'

@SymbolToken('http')
export class RequestHeaders extends HttpDict<IncomingHttpHeaders> {

}
