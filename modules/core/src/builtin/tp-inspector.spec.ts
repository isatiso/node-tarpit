/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { load_config } from '@tarpit/config'
import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import spies from 'chai-spies'
import { Platform } from '../platform'
import { TpInspector } from './tp-inspector'

chai.use(cap)
chai.use(spies)

describe('tp-inspector.ts', function() {

    const sandbox = chai.spy.sandbox()

    before(function() {
        sandbox.on(console, ['debug', 'log', 'info', 'warn', 'error'], () => unde)
    })

    after(function() {
        sandbox.restore(console)
    })

    describe('TpInspector', function() {

        const platform = new Platform(load_config({}))
        const inspector = platform.expose(TpInspector)

        it('should show start and terminate thing as -1', function() {
            expect(inspector?.started_at).to.equal(-1)
            expect(inspector?.start_time).to.equal(-1)
            expect(inspector?.terminated_at).to.equal(-1)
            expect(inspector?.terminate_time).to.equal(-1)
        })

        it('should wait start event', async function() {
            platform.start()
            await inspector?.wait_start()
            await inspector?.wait_start()
            expect(inspector?.started_at).to.gte(0)
            expect(inspector?.start_time).to.gte(0)
            expect(inspector?.terminated_at).to.equal(-1)
            expect(inspector?.terminate_time).to.equal(-1)
        })

        it('should wait terminate event', async function() {
            platform.terminate()
            await inspector?.wait_terminate()
            await inspector?.wait_terminate()
            expect(inspector?.terminated_at).to.gte(0)
            expect(inspector?.terminate_time).to.gte(0)
        })

        it('should show started_at', function() {
            expect(inspector?.started_at).to.be.gte(0)
        })

        it('should show start_time', function() {
            expect(inspector?.start_time).to.be.gte(0)
        })

        it('should show terminated_at', function() {
            expect(inspector?.terminated_at).to.be.gte(0)
        })

        it('should show terminate_time', function() {
            expect(inspector?.terminate_time).to.be.gte(0)
        })
    })
})


