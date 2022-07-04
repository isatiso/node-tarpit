/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Platform, TpInspector, TpRoot } from '@tarpit/core'
import { ConfirmProducer, Consume, JsonMessage, Publish, RabbitDefine, RabbitMQModule, TpConsumer, TpProducer } from '@tarpit/rabbitmq'
import { ScheduleModule, TpSchedule, Trigger } from '@tarpit/schedule'

@TpProducer({})
export class TestProducer {

    @Publish('test.x.topic', 'test.a.topic') send_topic_message!: ConfirmProducer<{ a: string, b: number }>

}

@TpConsumer({})
export class TestConsumer {

    constructor() {
    }

    @Consume('test.a')
    async listen_queue_a(msg: JsonMessage<{ a: string, b: string }>) {
        console.log('json message', msg.data)
    }
}

@TpSchedule()
export class TestSchedule {

    constructor(
        private producer: TestProducer,
    ) {
        setTimeout(async () => {
            const message = { a: 'task', b: Date.now() }
            console.log(message)
            // console.log(this.producer.send_topic_message)
            for (let i = 0; i < 10000; i++) {
                this.producer.send_topic_message.send(message, {}).catch(err => console.log(err))
            }
        }, 0)
    }

    @Trigger('*/2 * * * *', '定时任务')
    async task() {
        // const message = { a: 'task', b: Date.now() }
        // console.log(message)
        // console.log(this.producer.send_topic_message)
        // for (let i = 0; i < 10000; i++) {
        //     this.producer.send_topic_message.send(message)
        // }
    }
}

const definition = new RabbitDefine()
    .define_exchange('test.x.topic', 'topic')
    .define_exchange('test.x.direct', 'direct')
    .define_exchange('test.x.delay', 'x-delayed-message', { arguments: { 'x-delayed-type': 'topic' } })
    .define_queue('test.a')
    .define_queue('test.b')
    .bind_queue('test.x.topic', 'test.a', 'test.a.*')
    .bind_queue('test.x.topic', 'test.b', 'test.b.*')
    .bind_queue('test.x.direct', 'test.a', 'test.a')
    .bind_queue('test.x.direct', 'test.b', 'test.b')

@TpRoot({
    imports: [
        RabbitMQModule,
        ScheduleModule,
    ],
    providers: [
        { provide: RabbitDefine, useValue: definition, root: true },
    ],
    entries: [
        // TestProducer,
        TestConsumer,
        // TestSchedule,
    ],
})
export class TestRoot {
}

(async () => {
    const platform = new Platform({
        http: {
            port: 3000,
        },
        rabbitmq: {
            url: 'amqp://plank:ChKNwziiY84DjUP@112.74.191.78:5672',
            prefetch: 10,
            socket_options: {}
        }
    }).bootstrap(TestRoot).start()
    await platform.expose(TpInspector)?.wait_start()
    // const producer = platform.expose(TestProducer)!
    // console.log(producer)

    // setInterval(() => producer.send_topic_message.send({ a: 'asd', b: Date.now() }), 500)
})()
