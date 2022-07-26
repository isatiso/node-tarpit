/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Disabled, get_class_decorator, Optional } from '@tarpit/core'
import { expect } from 'chai'
import { Enqueue, Publish, TpProducer } from '../annotations'
import { ConfirmProducer } from '../builtin/confirm-producer'
import { Producer } from '../builtin/producer'
import { collect_produces } from './collect-produces'

describe('collect-produces.ts', function() {

    describe('#collect_produces()', function() {

        it('should collect produces from TpProducer', async function() {

            @TpProducer()
            class TempProducer {

                @Publish('tarpit.some.topic.exchange1', 'some.key', {})
                publish_to_exchange!: ConfirmProducer<{ a: number, b: string }>

                @Enqueue('tarpit.some.topic.queue1', {})
                send_to_queue!: Producer<{ a: number, b: string }>

                @Disabled()
                @Publish('tarpit.some.topic.exchange1', 'some.key')
                disabled_producer!: Producer<{ a: number, b: string }>
            }

            const meta = get_class_decorator(TempProducer).find(token => token instanceof TpProducer)
            expect(meta).to.exist
            const units = collect_produces(meta)
            expect(units).to.be.an('array').with.lengthOf(2)
        })

        it('should return empty array if given consumer meta has no unit', function() {

            @TpProducer()
            class TempProducer {
            }

            const meta = get_class_decorator(TempProducer).find(token => token instanceof TpProducer)
            expect(meta).to.exist
            const units = collect_produces(meta)
            expect(units).to.be.an('array').with.lengthOf(0)
        })

        it('should discard unit if its value is not function', function() {

            @TpProducer()
            class TempProducer {

                @Enqueue('tarpit.some.topic.queue1')
                send_to_queue!: String
            }

            const meta = get_class_decorator(TempProducer).find(token => token instanceof TpProducer)
            expect(meta).to.exist
            const units = collect_produces(meta)
            expect(units).to.be.an('array').with.lengthOf(0)
        })

        it('should ignore unknown decorator', function() {

            @TpProducer()
            class TempProducer {

                @Optional()
                @Enqueue('tarpit.some.topic.queue1')
                send_to_queue!: Producer<{ a: number, b: string }>
            }

            const meta = get_class_decorator(TempProducer).find(token => token instanceof TpProducer)
            expect(meta).to.exist
            const units = collect_produces(meta)
            expect(units).to.be.an('array').with.lengthOf(1)
        })
    })
})
