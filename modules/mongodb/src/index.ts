/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpMongoClientConfig, TpMongoClientConfigMap, TpMongoClientName } from './types'

export { GenericCollection } from './tools/generic-collection'
export { MongodbModule } from './mongodb.module'
export { TpMongo } from './annotations/tp-mongo'
export { TpMongoClientConfigMap, TpMongoClientName, TpMongoClientConfig } from './types'

type TpOtherClientConfigMap = Exclude<TpMongoClientName, 'mongodb'> extends never ? {} : {
    other_clients: Pick<TpMongoClientConfigMap, Exclude<TpMongoClientName, 'mongodb'>>
}

declare module '@tarpit/core' {

    export interface TpConfigSchema {
        mongodb: TpMongoClientConfig & TpOtherClientConfigMap
    }
}
