/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { TpLoader } from './tp-loader'

chai.use(cap)

describe('tp-loader.ts', function() {

    class Noop {
    }

    describe('TpLoader', function() {
        let loader: TpLoader

        beforeEach(() => {
            loader = new TpLoader()
        })

        it('should register loader', async function() {
            const on_start = chai.spy()
            const on_terminate = chai.spy()
            const on_load = chai.spy()
            loader.register(Symbol.for('test'), {
                on_start: async () => on_start(),
                on_terminate: async () => on_terminate(),
                on_load: () => on_load(),
            })
            loader.load({ token: Symbol.for('test') })
            expect(on_load).to.have.been.called.once
            await loader.start()
            expect(on_start).to.have.been.called.once
            await loader.terminate()
            expect(on_terminate).to.have.been.called.once
        })

        it('should ignore operation if given token exists', () => {
            expect((loader as any)._loaders.size).to.equal(0)
            loader.register(Symbol.for('test'), {} as any)
            expect((loader as any)._loaders.size).to.equal(1)
            loader.register(Symbol.for('test'), {} as any)
            expect((loader as any)._loaders.size).to.equal(1)
        })

        it('should ignore errors thrown by hooks', () => {
            loader.register(Symbol.for('test'), {
                on_start: async () => {
                    throw new Error()
                },
                on_terminate: async () => {
                    throw new Error()
                },
                on_load: async () => undefined,
            })
            expect(loader.start()).not.to.be.rejected
            expect(loader.terminate()).not.to.be.rejected
        })

        it('should throw error if loader not exists', function() {
            expect(() => loader.load({ token: Symbol.for('non-exists') })).to.throw('Can\'t find loader for component "undefined"')
            expect(() => loader.load({ token: Symbol.for('non-exists'), cls: Noop })).to.throw('Can\'t find loader for component "Noop"')
        })
    })
})
