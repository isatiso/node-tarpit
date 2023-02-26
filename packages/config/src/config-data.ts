/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Reference } from '@tarpit/judge'
import { Path, PathValue } from '@tarpit/type-tools'

export class ConfigData<T extends object> {

    private _data: Reference<T>

    constructor(data: T) {
        this._data = new Reference<T>(data)
    }

    get(): T
    get<K extends Path<T>>(path: K): PathValue<T, K>
    get<K extends Path<T>>(path?: K): PathValue<T, K> | T {
        if (!path) {
            return this._data.get()
        }
        return this._data.get(path)!
    }
}
