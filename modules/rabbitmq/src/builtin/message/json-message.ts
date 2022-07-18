/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { SymbolToken } from '@tarpit/core'
import { Judgement, MismatchDescription } from '@tarpit/judge'
import { ConsumeMessage } from 'amqplib'
import { kill_message } from '../../errors'

@SymbolToken('rabbitmq')
export class JsonMessage<T extends object> extends Judgement<any> {

    constructor(
        public readonly message: ConsumeMessage,
        content: T,
    ) {
        super(content)
    }

    protected on_error(prop: string, desc: MismatchDescription, on_error?: (prop: string, desc: MismatchDescription) => string): never {
        kill_message({ code: 400, msg: on_error?.(prop, desc) ?? `Value of [${prop}] is not match rule: [${desc.rule}]` })
    }
}
