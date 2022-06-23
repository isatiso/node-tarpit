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

describe('value-provider.ts', function() {

    let injector: Injector
    before(function() {
        injector = Injector.create()
    })

    describe('ValueProvider', function() {

        it('could create instance by static method "create"', function() {
            expect(() => ValueProvider.create(injector, { provide: 'a', useValue: 123 })).to.not.throw()
        })

        it('should set provider to injector on init', function() {
            const provider = ValueProvider.create(injector, { provide: 'b', useValue: 456, root: true })
            expect(injector.get('b')).to.equal(provider)
            expect(injector.get('b')?.create()).to.equal(456)
        })
    })
})
