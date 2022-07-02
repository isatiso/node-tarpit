/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { MessageError, MessageErrorDesc } from './message-error'

export type MessageDeadDesc = Partial<MessageErrorDesc>

export class MessageDead extends MessageError {
    constructor(desc?: MessageDeadDesc) {
        super({
            code: desc?.code ?? 'ERR.Kill',
            msg: desc?.msg ?? 'message is actively killed',
            origin: desc?.origin,
            detail: desc?.detail,
        })
    }
}

export function kill_message(desc?: MessageDeadDesc): never {
    throw new MessageDead(desc)
}
