/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { MongoClientOptions } from 'mongodb'

export { GenericCollection } from './tools/generic-collection'
export { MongodbModule } from './mongodb.module'
export { TpMongo } from './annotations/tp-mongo'

declare module '@tarpit/config' {

    export interface TpConfigSchema {
        mongodb: {
            uri: string
            // options?: MongoClientOptions
        }
    }
}
