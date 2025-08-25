/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Disabled, get_class_decorator, Optional } from '@tarpit/core'
import { describe, expect, it } from 'vitest'
import { Consume, TpConsumer } from '../annotations'
import { collect_consumes } from './collect-consumes'

describe('collect-consumes.ts', function() {

    describe('#collect_consumes()', function() {

        it('should collect consumes from TpConsumer', async function() {

            @TpConsumer()
            class TempConsumer {

                @Consume('tarpit.some.topic.queue1', { prefetch: 10 })
                async q1() {
                }

                @Disabled()
                @Consume('tarpit.some.topic.queue2', { prefetch: 10 })
                async q2() {
                }
            }

            const meta = get_class_decorator(TempConsumer).find(token => token instanceof TpConsumer)
            expect(meta).to.exist
            const units = collect_consumes(meta!)
            expect(units).to.be.an('array').with.lengthOf(1)
        })

        it('should return empty array if given consumer meta has no unit', function() {

            @TpConsumer()
            class TempConsumer {
            }

            const meta = get_class_decorator(TempConsumer).find(token => token instanceof TpConsumer)
            expect(meta).to.exist
            const units = collect_consumes(meta!)
            expect(units).to.be.an('array').with.lengthOf(0)
        })

        it('should discard unit if its value is not function', function() {

            @TpConsumer()
            class TempConsumer {

                @Consume('tarpit.some.topic.queue1', { prefetch: 10 })
                m: string = 'asd'
            }

            const meta = get_class_decorator(TempConsumer).find(token => token instanceof TpConsumer)
            expect(meta).to.exist
            const units = collect_consumes(meta!)
            expect(units).to.be.an('array').with.lengthOf(0)
        })

        it('should ignore unknown decorator', function() {

            @TpConsumer()
            class TempConsumer {

                @Optional()
                @Consume('tarpit.some.topic.queue2', { prefetch: 10 })
                async q2() {
                }
            }

            const meta = get_class_decorator(TempConsumer).find(token => token instanceof TpConsumer)
            expect(meta).to.exist
            const units = collect_consumes(meta!)
            expect(units).to.be.an('array').with.lengthOf(1)
        })
    })
})