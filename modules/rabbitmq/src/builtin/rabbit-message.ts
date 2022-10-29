/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { MIMEContent } from '@tarpit/content-type'
import { Judgement } from '@tarpit/judge'
import { ConsumeMessage, ConsumeMessageFields, MessageProperties } from 'amqplib'

export class RabbitMessage<T> extends Judgement<T extends object ? T : {}> implements ConsumeMessage {

    readonly content: Buffer
    readonly fields: ConsumeMessageFields
    readonly properties: MessageProperties
    readonly text: string | undefined

    constructor(
        message: ConsumeMessage,
        public readonly mime: MIMEContent<any>,
    ) {
        const data = mime.data && typeof mime.data === 'object' && mime.data.constructor.name === 'Object' ? mime.data : {}
        super(data)
        this.content = message.content
        this.fields = message.fields
        this.properties = message.properties
        this.text = this.mime.text
    }
}
