/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */
import { SymbolToken, TpService } from '@tarpit/core'
import { ConfirmProducer } from '../builtin'

@SymbolToken('rabbitmq')
@TpService({ inject_root: true })
export class RabbitSessionCollector extends Set<ConfirmProducer<any>> {

}
