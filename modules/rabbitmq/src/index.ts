/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

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

    export interface TpConfigSchema {
        rabbitmq: {
            url: string | AMQPConnect
            timeout?: number
            prefetch?: number
            socket_options?: unknown
        }
    }
}

export { Publish, Enqueue, Consume, TpConsumer, TpProducer } from './annotations'
export {
    ack_message,
    Ack,
    requeue_message,
    MessageRequeue,
    MessageRequeueDesc,
    kill_message,
    MessageDead,
    MessageDeadDesc,
} from './errors'

export { ConfirmProducer } from './builtin/confirm-producer'
export { RabbitMessage } from './builtin/rabbit-message'
export { Producer } from './builtin/producer'
export { RabbitRetryStrategy } from './services/rabbit-retry-strategy'
export { RabbitDefine, ExchangeOptions, QueueOptions, DefaultRabbitmqExchange, RabbitDefineToken } from './services/rabbit-define'
export { RabbitmqModule } from './rabbitmq-module'
