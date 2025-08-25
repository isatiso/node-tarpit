/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { describe, expect, it } from 'vitest'
import { detect_cycle_ref } from './detect-cycle-ref'

describe('detect-cycle-ref.ts', () => {

    class A {

    }

    class B {

    }

    class C {

    }

    describe('#detect_cycle_ref()', () => {
        it('should throw error if found token in parents', () => {
            expect(() => detect_cycle_ref(C, [{ token: C, index: 0 }, { token: A }, { token: B, index: 2 }]))
                .toThrow('circle dependency: C[0] => A[] => B[2] => C[0]')
        })

        it('should do nothing if there\'s no cycle ref', () => {
            expect(() => detect_cycle_ref(C, [{ token: A, index: 1 }, { token: B, index: 2 }])).not.toThrow()
            expect(() => detect_cycle_ref(C)).not.toThrow()
        })
    })
})
