/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { make_decorator, TpWorker } from '@tarpit/core'
import { TpMongoToken } from './__token__'

export interface TpMongoOptions {
}

export type TpMongo = InstanceType<typeof TpMongo>
export const TpMongo = make_decorator('TpMongo', (db: string, collection: string, options?: TpMongoOptions) => ({
    db,
    collection,
    ...options,
    token: TpMongoToken
}), TpWorker)
