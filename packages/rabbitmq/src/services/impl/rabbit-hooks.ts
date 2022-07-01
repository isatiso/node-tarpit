/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '@tarpit/core'
import { ConsumeMessage } from 'amqplib'
import { MessageDead, MessageRequeue } from '../../errors'
import { AbstractRabbitHooks } from '../inner/abstract-rabbit-hooks'

@TpService({ inject_root: true })
export class RabbitHooks extends AbstractRabbitHooks {

    on_init(message: ConsumeMessage): Promise<void> {
        return Promise.resolve(undefined)
    }

    on_ack(message: ConsumeMessage, decoded_content: string): Promise<void> {
        return Promise.resolve(undefined)
    }

    on_dead(message: ConsumeMessage, decoded_content: string, error: MessageDead): Promise<void> {
        return Promise.resolve(undefined)
    }

    on_requeue(message: ConsumeMessage, decoded_content: string, error: MessageRequeue): Promise<void> {
        return Promise.resolve(undefined)
    }
}
