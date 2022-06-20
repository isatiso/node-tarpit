/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

export interface TaskErrorDescription {
    readonly code: string | number
    readonly msg: string
    readonly detail?: object
    readonly origin?: any
}

export class TaskError extends Error {

    public readonly code: string | number
    public readonly detail?: object
    public readonly origin?: any
    public readonly stack: string

    constructor(desc: TaskErrorDescription) {
        super(desc.msg ?? 'Unknown Trigger Error')
        this.code = desc.code ?? 'ERR'
        this.origin = desc.origin
        if (desc.origin?.stack) {
            this.stack = desc.origin.stack
        } else if (desc.origin) {
            this.stack = desc.origin.toString()
        } else {
            this.stack = ''
        }
    }

    jsonify(fields?: Array<keyof TaskError>) {
        fields = fields ?? ['code', 'message', 'detail', 'stack'] as Array<keyof TaskError>
        const res: any = {}
        for (const f of fields) {
            res[f] = this[f]
        }
        return res
    }
}
