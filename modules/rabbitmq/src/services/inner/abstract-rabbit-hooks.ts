/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { MIMEContent } from '@tarpit/content-type'
import { SymbolToken } from '@tarpit/core'
import { ConsumeMessage } from 'amqplib'
import { MessageDead, MessageRequeue } from '../../errors'

@SymbolToken('rabbitmq')
export abstract class AbstractRabbitHooks {

    abstract on_init(message: ConsumeMessage): Promise<void>

    abstract on_ack(message: ConsumeMessage, content: MIMEContent<any> | undefined): Promise<void>

    abstract on_requeue(message: ConsumeMessage, content: MIMEContent<any> | undefined, error: MessageRequeue): Promise<void>

    abstract on_dead(message: ConsumeMessage, content: MIMEContent<any> | undefined, error: MessageDead): Promise<void>

}
