/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConsumeMessage } from 'amqplib'

export class TextMessage extends String {

    constructor(
        public readonly message: ConsumeMessage,
        content: string,
    ) {
        super(content)
    }
}
