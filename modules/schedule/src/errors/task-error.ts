/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpError, TpErrorDescription } from '@tarpit/core'

export interface TaskErrorDescription extends TpErrorDescription {
}

export class TaskError extends TpError {

    override jsonify_fields: Array<keyof this> = ['code', 'message', 'detail', 'stack']

    constructor(desc: TaskErrorDescription) {
        super(desc)
    }
}
