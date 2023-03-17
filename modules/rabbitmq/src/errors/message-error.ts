/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpError, TpErrorDescription } from '@tarpit/core'

export interface MessageErrorDesc extends TpErrorDescription {
}

export class MessageError extends TpError {

    override jsonify_fields: Array<keyof this> = ['code', 'message', 'detail', 'stack']

    protected constructor(desc: MessageErrorDesc) {
        super(desc)
    }
}
