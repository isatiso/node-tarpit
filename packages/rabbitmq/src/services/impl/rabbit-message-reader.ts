/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '@tarpit/core'
import { ConsumeMessage } from 'amqplib'
import { AbstractRabbitMessageReader } from '../inner/abstract-rabbit-message-reader'

@TpService({ inject_root: true })
export class RabbitMessageReader extends AbstractRabbitMessageReader {
    override async read(message: ConsumeMessage) {
        return message.content.toString('utf-8')
    }
}
