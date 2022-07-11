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
import { Injector } from '../di'
import { BuiltinTpLogger, TpLogger } from './tp-logger'

chai.use(cap)
chai.use(spies)

describe('tp-logger.ts', function() {

    let tmp: any
    before(function() {
        tmp = console.log
        console.log = (..._args: any[]) => undefined
    })

    after(function() {
        console.log = tmp
    })

    describe('TpLogger', function() {

        it('should log after start and terminate event', async function() {
            const injector = Injector.create()
            const logger = new BuiltinTpLogger(injector)
            const spy_after_start = chai.spy.on(logger, 'after_start')
            const spy_after_terminate = chai.spy.on(logger, 'after_terminate')

            injector.emit('start')
            injector.emit('start-time', 200)
            injector.emit('terminate')
            injector.emit('terminate-time', 200)

            return new Promise(resolve => {
                setImmediate(() => {
                    expect(spy_after_start).to.have.been.called.with(200)
                    expect(spy_after_start).to.have.been.called.once
                    expect(spy_after_terminate).to.have.been.called.with(200)
                    expect(spy_after_terminate).to.have.been.called.once
                    resolve()
                })
            })
        })
    })
})
