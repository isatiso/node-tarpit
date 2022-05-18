/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */


import { TpService } from '../annotations'

/**
 * 内置的时间戳服务。
 *
 * [[include:builtin/timestamp.md]]
 *
 * @category Builtin
 */

@TpService()
export class Timestamp extends Number {

    private _timestamp = Date.now()

    valueOf() {
        return this._timestamp
    }
}
