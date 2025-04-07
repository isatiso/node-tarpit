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
import { TestTpThread } from './fixture/test-worker'

import { TpThreadStrategy } from './tp-thread-strategy'

chai.use(cap)
chai.use(spies)

describe('tp-thread.ts', function() {

    const sandbox = chai.spy.sandbox()

    before(function() {
        TestTpThread.tp_thread.start()
        // sandbox.on(console, ['debug', 'log', 'info', 'warn', 'error'], () => undefined)
    })

    after(function() {
        TestTpThread.tp_thread.terminate()
        sandbox.restore()
    })

    describe('TpThread', function() {

        it('should setup workers after started', function() {
            const max_threads = TestTpThread.injector.get(TpThreadStrategy)?.create()!.max_threads
            expect(TestTpThread.tp_thread.workers_count).eq(max_threads)
        })

        it('should execute task', async function() {
            this.timeout(10000);
            const cases: number[][] = []
            for (let i = 0; i < 100; i++) {
                const a = Math.floor(Math.random() * 1000)
                const b = Math.floor(Math.random() * 1000)
                cases.push([a, b, a + b])
            }

            const results = await Promise.all(cases.map(([a, b]) => TestTpThread.tp_thread.run_task(TestTpThread.TestService, 'plus', a, b)))
            expect(results).to.have.lengthOf(cases.length)
            expect(results).to.deep.equal(cases.map(([, , res]) => res))
        })

        it('should execute async task', async function() {
            this.timeout(10000)
            const cases: number[][] = []
            for (let i = 0; i < 100; i++) {
                const a = Math.floor(Math.random() * 1000)
                const b = Math.floor(Math.random() * 1000)
                cases.push([a, b, a + b])
            }

            const results = await Promise.all(cases.map(([a, b]) => TestTpThread.tp_thread.run_task(TestTpThread.TestService, 'async_plus', a, b)))
            expect(results).to.have.lengthOf(cases.length)
            expect(results).to.deep.equal(cases.map(([, , res]) => res))
        })

        it('should throw error', async function() {
            const res = TestTpThread.tp_thread.run_task(TestTpThread.TestService, 'throw_error')

            await expect(res).to.be.rejected
            await expect(res.catch(e => e)).to.eventually.have.property('message', 'test error')
        })

        it('should throw error if service is not a TpComponent', async function() {
            const res = TestTpThread.tp_thread.run_task(TestTpThread.NotAService, 'test_method')

            await expect(res).to.be.rejected
            await expect(res.catch(e => e)).to.eventually.have.property('message', 'NotAService is not a TpComponent')
        })
    })
})
