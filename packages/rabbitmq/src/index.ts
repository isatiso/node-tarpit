/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Constructor } from '@tarpit/core'
import { TpConsumerMeta, TpProducerMeta } from './__types__'

export interface AMQPConnect {
    /**
     * The to be used protocol
     *
     * Default value: 'amqp'
     */
    protocol?: string
    /**
     * Hostname used for connecting to the server.
     *
     * Default value: 'localhost'
     */
    hostname?: string
    /**
     * Port used for connecting to the server.
     *
     * Default value: 5672
     */
    port?: number
    /**
     * Username used for authenticating against the server.
     *
     * Default value: 'guest'
     */
    username?: string
    /**
     * Password used for authenticating against the server.
     *
     * Default value: 'guest'
     */
    password?: string
    /**
     * The desired locale for error messages. RabbitMQ only ever uses en_US
     *
     * Default value: 'en_US'
     */
    locale?: string
    /**
     * The size in bytes of the maximum frame allowed over the connection. 0 means
     * no limit (but since frames have a size field which is an unsigned 32 bit integer, it’s perforce 2^32 - 1).
     *
     * Default value: 0x1000 (4kb) - That's the allowed minimum, it will fit many purposes
     */
    frameMax?: number
    /**
     * The period of the connection heartbeat in seconds.
     *
     * Default value: 0
     */
    heartbeat?: number
    /**
     * What VHost shall be used.
     *
     * Default value: '/'
     */
    vhost?: string
}

declare module '@tarpit/core' {

    export interface TpRootOptions {
        routers?: Constructor<any>[]
        consumers?: Constructor<any>[]
    }

    export interface TpModuleLikeCollector {
        TpConsumer: TpConsumerMeta
    }

    export interface TpServiceLikeCollector {
        TpProducer: TpProducerMeta
    }
}

declare module '@tarpit/config' {

    export interface TpConfigSchema {
        rabbitmq: {
            url: string | AMQPConnect
            prefetch?: number
            socket_options?: unknown
        }
    }
}

export { BindExchange, BindQueue, AssertQueue, AssertExchange } from './__tools__'
export * from './__annotations__'
export * from './__types__'
export { Letter, PURE_LETTER } from './letter'
export { TpRabbitMQ } from './tp-rabbitmq'
export { ChannelWrapper } from './channel-wrapper'
export { Dead, Requeue, Ack, requeue_message, kill_message, ack_message } from './error'
