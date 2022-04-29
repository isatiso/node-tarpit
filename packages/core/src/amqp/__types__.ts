/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export interface MessageProperties {
    expiration: string | undefined
    userId: string | undefined
    deliveryMode: number | undefined
    contentType: string | undefined
    contentEncoding: string | undefined
    headers: any | undefined
    priority: number | undefined
    correlationId: string | undefined
    replyTo: string | undefined
    messageId: string | undefined
    timestamp: number | undefined
    type: string | undefined
    appId: string | undefined
    clusterId: string | undefined
}

export interface MessageFields {
    consumerTag: string
    deliveryTag: number
    redelivered: boolean
    exchange: string
    routingKey: string
}

export interface MessageObject {
    content: Buffer
    fields: MessageFields
    properties: MessageProperties
}
