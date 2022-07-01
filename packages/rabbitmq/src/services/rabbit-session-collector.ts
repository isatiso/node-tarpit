/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */
import { TpService } from '@tarpit/core'
import { RabbitSession } from '../builtin'

@TpService({ inject_root: true })
export class RabbitSessionCollector extends Set<RabbitSession> {

}
