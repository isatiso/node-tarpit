/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { MIMEContent } from '@tarpit/content-type'
import { TpService } from '@tarpit/core'
import { ConsumeMessage } from 'amqplib'
import { MessageDead, MessageRequeue } from '../errors'

@TpService({ inject_root: true })
export class RabbitHooks {

    on_init(message: ConsumeMessage): Promise<void> {
        return Promise.resolve(undefined)
    }

    on_ack(message: ConsumeMessage, content: MIMEContent<any> | undefined): Promise<void> {
        return Promise.resolve(undefined)
    }

    on_dead(message: ConsumeMessage, content: MIMEContent<any> | undefined, error: MessageDead): Promise<void> {
        return Promise.resolve(undefined)
    }

    on_requeue(message: ConsumeMessage, content: MIMEContent<any> | undefined, error: MessageRequeue): Promise<void> {
        return Promise.resolve(undefined)
    }
}
