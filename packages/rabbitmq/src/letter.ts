/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { PureJSON } from '@tarpit/core'
import { MessageFields, MessageProperties } from './__types__'

export const PURE_LETTER = 'PURE_LETTER'

export class Letter<T extends PureJSON> {
    constructor(
        public readonly content: T,
        public readonly fields: Readonly<MessageFields>,
        public readonly properties: Readonly<MessageProperties>,
    ) {
    }
}
