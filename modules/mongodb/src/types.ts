/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

export interface TpMongoClientConfig {
    url: string
    // This field is actually a MongoClientOptions, but it's too complicated to used, and will broke the type inference of ConfigData.
    // So I leave a unknown here.
    // TODO: Figure out some better way to deal with this field.
    options?: unknown
}

export interface TpMongoClientConfigMap {
    mongodb: TpMongoClientConfig
}

export type TpMongoClientName = { [K in keyof TpMongoClientConfigMap]: TpMongoClientConfigMap[K] extends TpMongoClientConfig ? K : never }[keyof TpMongoClientConfigMap]

