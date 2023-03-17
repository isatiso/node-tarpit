/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

export interface TpErrorDescription {
    readonly code: string | number
    readonly msg: string
    readonly detail?: object
    readonly origin?: any
}

export class TpError<E = any> extends Error {
    public readonly code: string | number
    public readonly msg: string
    public readonly detail?: object
    public readonly origin?: E
    public override readonly stack: string

    protected jsonify_fields: Array<keyof this> = ['code', 'msg', 'detail', 'stack']

    constructor(desc: TpErrorDescription) {
        super(desc.msg)
        this.code = desc.code
        this.msg = desc.msg
        this.detail = desc.detail
        this.origin = desc.origin
        if (desc.origin?.stack) {
            this.stack = desc.origin.stack
        } else if (desc.origin) {
            this.stack = desc.origin.toString()
        } else {
            this.stack = ''
        }
    }

    jsonify(fields?: (keyof this)[]) {
        fields = fields ?? this.jsonify_fields
        const res: any = {}
        for (const f of fields) {
            res[f] = this[f]
        }
        return res
    }
}

export function throw_native_error(msg: string): never {
    throw new Error(msg)
}
