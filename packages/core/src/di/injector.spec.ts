/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { Injector } from './injector'
import { ValueProvider } from './value-provider'

chai.use(cap)

describe('injector.ts', function() {

    let injector: Injector

    describe('Injector', function() {

        it('could create instance by static method "create"', function() {
            expect(() => injector = Injector.create()).to.not.throw()
        })

        it('should set provider to Injector', function() {
            const value_provider = ValueProvider.create(injector, 'a', 123)
            const res = injector.set('b', value_provider)
            expect(res).to.equal(value_provider)
        })

        it('should get provider from Injector', function() {
            const res = injector.get('b')
            expect(res?.create()).to.equal(123)
        })

        it('should get undefined if specified token not exists', function() {
            const res = injector.get('c')
            expect(res).to.be.undefined
        })

        it('should check if provider exists', function() {
            expect(injector.has('b')).to.be.true
            expect(injector.has('c')).to.be.false
        })
    })

    describe('Injector as EventEmitter', function() {

        it('could emit and listening event', function() {
            let mark1 = false
            let mark2 = false
            injector.on('start', () => mark1 = true)
            injector.once('terminate', () => mark2 = true)
            injector.emit('start')
            injector.emit('terminate')
            setTimeout(() => expect(mark1).to.be.true, 0)
            setTimeout(() => expect(mark2).to.be.true, 0)
        })
    })

    describe('Injector as quit inspector', function() {

        it('could set quit hooks', async function() {
            const child_injector = Injector.create(injector)
            expect((child_injector as any).emitter).to.equal((injector as any).emitter)
            expect((child_injector as any).board).to.equal((injector as any).board)
            const start = Date.now()
            child_injector.mark_quit_hook(() => new Promise(resolve => setTimeout(() => resolve(null), 120)))
            child_injector.mark_quit_hook(() => new Promise(resolve => setTimeout(() => resolve(null), 200)))
            child_injector.mark_quit_hook(() => new Promise(resolve => setTimeout(() => resolve(null), 80)))
            child_injector.emit('terminate')
            await child_injector.wait_all_quit()
            expect(Date.now() - start).to.be.closeTo(200, 10)
        })
    })
})
