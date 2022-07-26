/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { MessageError, MessageErrorDesc } from './message-error'

export type MessageRequeueDesc = Partial<MessageErrorDesc>

export class MessageRequeue extends MessageError {
    constructor(desc?: MessageRequeueDesc) {
        desc = desc ?? {}
        super({
            code: desc.code ?? 'ERR.Requeue',
            msg: desc.msg ?? 'message need to requeue',
            origin: desc.origin,
            detail: desc.detail,
        })
    }
}

export function requeue_message(desc?: MessageRequeueDesc): never {
    throw new MessageRequeue(desc)
}
