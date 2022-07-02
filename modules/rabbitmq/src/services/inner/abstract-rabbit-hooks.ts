/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */
import { ConsumeMessage } from 'amqplib'
import { MessageDead, MessageRequeue } from '../../errors'

export abstract class AbstractRabbitHooks {

    abstract on_init(message: ConsumeMessage): Promise<void>

    abstract on_ack(message: ConsumeMessage, decoded_content: string): Promise<void>

    abstract on_requeue(message: ConsumeMessage, decoded_content: string, error: MessageRequeue): Promise<void>

    abstract on_dead(message: ConsumeMessage, decoded_content: string, error: MessageDead): Promise<void>

}
