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
import { Debug } from './debug'

chai.use(cap)
chai.use(spies)

class Dep {
}

describe('debug.ts', function() {
    describe('Debug', function() {
        it('should echo whole param types if put on the head of class', async function() {

            const spy = chai.spy.on(Debug, 'log')

            @Debug()
            class Test {
                constructor(_a: number, _b: string, _c: Dep) {
                }
            }

            expect(spy).to.have.been.called.with(`${Test.name} dependencies`, [Number, String, Dep])
            expect(spy).to.have.been.called.once
            chai.spy.restore(Debug, 'log')
        })

        it('should echo type of specified parameter if put on the head of constructor parameter', async function() {

            const spy = chai.spy.on(Debug, 'log')

            class Test {
                constructor(_a: number, _b: string, @Debug() c: Dep) {
                }
            }

            expect(spy).to.have.been.called.with(`${Test.name}.args[2] type`, Dep)
            expect(spy).to.have.been.called.once
            chai.spy.restore(Debug, 'log')
        })

        it('should echo whole param types of method if put on the head of class method', async function() {

            const spy = chai.spy.on(Debug, 'log')

            class Test {
                @Debug()
                method(_a: number, _b: string, _c: Dep) {
                }
            }

            expect(spy).to.have.been.called.with(`${Test.name}.method dependencies`, [Number, String, Dep])
            expect(spy).to.have.been.called.once
            chai.spy.restore(Debug, 'log')
        })

        it('should echo type of specified parameter of method if put on the head of method parameter', async function() {

            const spy = chai.spy.on(Debug, 'log')

            class Test {
                method(_a: number, @Debug() c: Dep, _b: string) {
                }
            }

            expect(spy).to.have.been.called.with(`${Test.name}.method.args[1] type`, Dep)
            expect(spy).to.have.been.called.once
            chai.spy.restore(Debug, 'log')
        })

        it('should echo type of specified property if put on the head of property', async function() {

            const spy = chai.spy.on(Debug, 'log')

            class Test {
                @Debug() prop?: Dep
            }

            expect(spy).to.have.been.called.with(`${Test.name}.prop type`, Dep)
            expect(spy).to.have.been.called.once
            chai.spy.restore(Debug, 'log')
        })
    })
})
