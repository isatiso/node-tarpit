/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { BaseMessage } from './base-message'

export class JsonMessage<T extends object> extends BaseMessage {

    public readonly content: T = JSON.parse(this.raw)

}
