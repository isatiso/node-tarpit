/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConsumeMessageFields, MessageProperties } from 'amqplib'

export class BaseMessage {

    protected raw: string

    constructor(
        content: string,
        public readonly fields: Readonly<ConsumeMessageFields>,
        public readonly properties: Readonly<MessageProperties>,
    ) {
        this.raw = content
    }
}
