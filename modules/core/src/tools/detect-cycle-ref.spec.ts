/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { detect_cycle_ref } from './detect-cycle-ref'

chai.use(cap)

describe('detect-cycle-ref.ts', function() {

    class A {

    }

    class B {

    }

    class C {

    }

    describe('#detect_cycle_ref()', function() {
        it('should throw error if found token in parents', function() {
            expect(() => detect_cycle_ref(C, [{ token: C, index: 0 }, { token: A }, { token: B, index: 2 }]))
                .to.throw('circle dependency: C[0] => A[] => B[2] => C[0]')
        })

        it('should do nothing if there\'s no cycle ref', function() {
            expect(() => detect_cycle_ref(C, [{ token: A, index: 1 }, { token: B, index: 2 }])).to.not.throw()
            expect(() => detect_cycle_ref(C)).to.not.throw()
        })
    })
})
