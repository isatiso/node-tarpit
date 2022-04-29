/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { MessageFields, MessageProperties } from './__types__'
import { PureJSONObject } from '../core'

export const PURE_LETTER = 'PURE_LETTER'

export class Letter<T extends PureJSONObject> {
    constructor(
        public readonly content: T,
        public readonly fields: Readonly<MessageFields>,
        public readonly properties: Readonly<MessageProperties>,
    ) {
    }
}
