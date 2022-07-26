/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Path, PathValue, Reference } from '@tarpit/judge'

export interface TpConfigSchema {
}

export class ConfigData extends Reference<TpConfigSchema> {

    constructor(data: TpConfigSchema) {
        super(data)
    }

    get(): TpConfigSchema
    get<K extends Path<TpConfigSchema>>(path: K): PathValue<TpConfigSchema, K>
    get<K extends Path<TpConfigSchema>>(path?: K): PathValue<TpConfigSchema, K> | TpConfigSchema {
        if (!path) {
            return super.get()
        }
        return super.get(path)!
    }
}
