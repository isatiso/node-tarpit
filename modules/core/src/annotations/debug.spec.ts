/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { describe, expect, it } from 'vitest'
import { Debug } from './debug'

class Dep {
}

describe('debug.ts', () => {

    describe('@Debug', () => {

        it('should echo whole param types if put on the head of class', async () => {

            const log_history: any[][] = []
            Debug.log = (...args: any[]) => {
                log_history.push(args)
            }

            @Debug()
            class Test {
                constructor(_a: number, _b: string, _c: Dep) {
                }
            }

            expect(log_history[0]).toEqual([`${Test.name} dependencies`, [Number, String, Dep]])
            expect(log_history[1]).toBeUndefined()
        })

        it('should echo type of specified parameter if put on the head of constructor parameter', async () => {

            const log_history: any[][] = []
            Debug.log = (...args: any[]) => {
                log_history.push(args)
            }

            class Test {
                constructor(_a: number, _b: string, @Debug() c: Dep) {
                }
            }

            expect(log_history[0]).toEqual([`${Test.name}.args[2] type`, Dep])
            expect(log_history[1]).toBeUndefined()
        })

        it('should echo whole param types of method if put on the head of class method', async () => {

            const log_history: any[][] = []
            Debug.log = (...args: any[]) => {
                log_history.push(args)
            }

            class Test {
                @Debug()
                method(_a: number, _b: string, _c: Dep) {
                }
            }

            expect(log_history[0]).toEqual([`${Test.name}.method dependencies`, [Number, String, Dep]])
            expect(log_history[1]).toBeUndefined()
        })

        it('should echo type of specified parameter of method if put on the head of method parameter', async () => {

            const log_history: any[][] = []
            Debug.log = (...args: any[]) => {
                log_history.push(args)
            }

            class Test {
                method(_a: number, @Debug() c: Dep, _b: string) {
                }
            }

            expect(log_history[0]).toEqual([`${Test.name}.method.args[1] type`, Dep])
            expect(log_history[1]).toBeUndefined()
        })

        it('should echo type of specified property if put on the head of property', async () => {

            const log_history: any[][] = []
            Debug.log = (...args: any[]) => {
                log_history.push(args)
            }

            class Test {
                @Debug() prop?: Dep
            }

            expect(log_history[0]).toEqual([`${Test.name}.prop type`, Dep])
            expect(log_history[1]).toBeUndefined()
        })
    })
})
