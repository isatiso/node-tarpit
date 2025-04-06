/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import spies from 'chai-spies'
import { TpService } from '../annotations'
import { ClassProvider, Injector } from '../di'
import { TpThread } from './tp-thread'
import { TpThreadStrategy } from './tp-thread-strategy'

chai.use(cap)
chai.use(spies)

@TpService()
class TestService {
    constructor() {
    }

    async test_method(a: number, b: number) {
        console.log('plus', a, b)
        return a + b
    }
}

describe('tp-thread.ts', function() {

    const sandbox = chai.spy.sandbox()

    before(function() {
        // sandbox.on(console, ['debug', 'log', 'info', 'warn', 'error'], () => undefined)
    })

    after(function() {
        // sandbox.restore()
    })

    describe('TpThread', function() {

        it('should setup workers after started', function() {
            const injector = Injector.create()

            const strategy = new TpThreadStrategy(5)
            const tp_thread = new TpThread(
                strategy,
                injector
            )
            expect(tp_thread.workers_count).eq(0)
            tp_thread.start()
            expect(tp_thread.workers_count).eq(5)
            tp_thread.terminate()
        })

        it('should execute task', async function() {
            const injector = Injector.create()
            ClassProvider.create(injector, { provide: TestService, useClass: TestService })
            const strategy = new TpThreadStrategy(5)
            const tp_thread = new TpThread(
                strategy,
                injector
            )
            tp_thread.start()
            const cases = [
                [1, 2, 3],
                [2, 4, 6],
                [6, 7, 13],
                [9, 8, 17],
                [1, 100, 101],
                [1, 2, 3],
                [2, 4, 6],
                [6, 7, 13],
                [9, 8, 17],
                [1, 100, 101],
            ]

            const results = await Promise.all(cases.map(([a, b]) => tp_thread.run_task(TestService, 'test_method', a, b)))
            expect(results).to.have.lengthOf(cases.length)
            expect(results).to.deep.equal(cases.map(([, , res]) => res))
            tp_thread.terminate()
        })
    })
})
// const spy_after_start = chai.spy.on(logger, 'after_start')
// const spy_after_terminate = chai.spy.on(logger, 'after_terminate')
//
// injector.emit('start')
// injector.emit('start-time', 200)
// injector.emit('terminate')
// injector.emit('terminate-time', 200)
//
// return new Promise(resolve => {
//     setImmediate(() => {
//         expect(spy_after_start).to.have.been.called.with(200)
//         expect(spy_after_start).to.have.been.called.once
//         expect(spy_after_terminate).to.have.been.called.with(200)
//         expect(spy_after_terminate).to.have.been.called.once
//         resolve()
//     })
// })
