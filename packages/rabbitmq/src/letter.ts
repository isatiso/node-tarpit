/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
