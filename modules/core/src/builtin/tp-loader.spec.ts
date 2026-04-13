/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TpLoader } from './tp-loader'

describe('tp-loader.ts', () => {

    class Noop {
    }

    describe('TpLoader', () => {
        let loader: TpLoader

        beforeEach(() => {
            loader = new TpLoader()
            vi.spyOn(console, 'log').mockImplementation(() => undefined)
        })

        afterEach(() => {
            vi.restoreAllMocks()
        })

        it('should register loader', async () => {
            const on_start = vi.fn()
            const on_terminate = vi.fn()
            const on_load = vi.fn()
            loader.register(Symbol.for('test'), {
                on_start: async () => on_start(),
                on_terminate: async () => on_terminate(),
                on_load: () => on_load(),
            })
            loader.load({ token: Symbol.for('test') })
            expect(on_load).toHaveBeenCalledTimes(1)
            await loader.start()
            expect(on_start).toHaveBeenCalledTimes(1)
            await loader.terminate()
            expect(on_terminate).toHaveBeenCalledTimes(1)
        })

        it('should ignore operation if given token exists', () => {
            expect((loader as any)._loaders.size).toEqual(0)
            loader.register(Symbol.for('test'), {} as any)
            expect((loader as any)._loaders.size).toEqual(1)
            loader.register(Symbol.for('test'), {} as any)
            expect((loader as any)._loaders.size).toEqual(1)
        })

        it('should ignore errors thrown by hooks', async () => {
            loader.register(Symbol.for('test'), {
                on_start: async () => {
                    throw new Error()
                },
                on_terminate: async () => {
                    throw new Error()
                },
                on_load: async () => undefined,
            })
            await expect(loader.start()).resolves.toBeUndefined()
            expect(console.log).toHaveBeenCalledTimes(1)
            await expect(loader.terminate()).resolves.toBeUndefined()
            expect(console.log).toHaveBeenCalledTimes(2)
        })

        it('should throw error if loader not exists', () => {
            expect(() => loader.load({ token: Symbol.for('non-exists') })).toThrow('Can\'t find loader for component \"undefined\"')
            expect(() => loader.load({ token: Symbol.for('non-exists'), cls: Noop })).toThrow('Can\'t find loader for component \"Noop\"')
        })

        it('should execute on_start in dependency order', async () => {
            const order: string[] = []
            class A {}
            class B {}
            class C {}

            loader.record(A, [])
            loader.on_start(A, async () => { order.push('A') })
            loader.record(B, [A])
            loader.on_start(B, async () => { order.push('B') })
            loader.record(C, [B])
            loader.on_start(C, async () => { order.push('C') })

            await loader.start()
            expect(order).toEqual(['A', 'B', 'C'])
        })

        it('should execute on_terminate in reverse dependency order', async () => {
            const order: string[] = []
            class A {}
            class B {}
            class C {}

            loader.record(A, [])
            loader.on_terminate(A, async () => { order.push('A') })
            loader.record(B, [A])
            loader.on_terminate(B, async () => { order.push('B') })
            loader.record(C, [B])
            loader.on_terminate(C, async () => { order.push('C') })

            await loader.terminate()
            expect(order).toEqual(['C', 'B', 'A'])
        })

        it('should execute independent nodes in parallel within same layer', async () => {
            const order: string[] = []
            class A {}
            class B {}
            class C {}

            loader.record(A, [])
            loader.on_start(A, async () => { order.push('A') })
            loader.record(B, [])
            loader.on_start(B, async () => { order.push('B') })
            loader.record(C, [A, B])
            loader.on_start(C, async () => { order.push('C') })

            await loader.start()
            expect(order.slice(0, 2).sort()).toEqual(['A', 'B'])
            expect(order[2]).toEqual('C')
        })

        it('should handle diamond dependency', async () => {
            const order: string[] = []
            class A {}
            class B {}
            class C {}
            class D {}

            loader.record(A, [])
            loader.on_start(A, async () => { order.push('A') })
            loader.record(B, [A])
            loader.on_start(B, async () => { order.push('B') })
            loader.record(C, [A])
            loader.on_start(C, async () => { order.push('C') })
            loader.record(D, [B, C])
            loader.on_start(D, async () => { order.push('D') })

            await loader.start()
            expect(order[0]).toEqual('A')
            expect(order.slice(1, 3).sort()).toEqual(['B', 'C'])
            expect(order[3]).toEqual('D')
        })

        it('should ignore deps on non-existent nodes', async () => {
            const order: string[] = []
            class A {}
            class Unknown {}

            loader.record(A, [Unknown])
            loader.on_start(A, async () => { order.push('A') })

            await loader.start()
            expect(order).toEqual(['A'])
        })

        it('should start node eagerly when its deps complete', async () => {
            const timestamps: Record<string, number> = {}
            class A {}
            class B {}
            class C {}

            loader.record(A, [])
            loader.on_start(A, async () => {
                await new Promise(r => setTimeout(r, 50))
                timestamps['A'] = Date.now()
            })
            loader.record(B, [])
            loader.on_start(B, async () => {
                await new Promise(r => setTimeout(r, 200))
                timestamps['B'] = Date.now()
            })
            loader.record(C, [A])
            loader.on_start(C, async () => {
                timestamps['C_start'] = Date.now()
            })

            await loader.start()
            expect(timestamps['C_start']).toBeLessThanOrEqual(timestamps['B'])
        })

        it('should handle register with deps', async () => {
            const order: string[] = []
            const token_a = Symbol.for('a')
            const token_b = Symbol.for('b')

            loader.register(token_a, {
                on_start: async () => { order.push('A') },
                on_terminate: async () => undefined,
                on_load: () => undefined,
            })
            loader.register(token_b, {
                on_start: async () => { order.push('B') },
                on_terminate: async () => undefined,
                on_load: () => undefined,
            }, [token_a])

            await loader.start()
            expect(order).toEqual(['A', 'B'])
        })

        it('should handle mixed register and on_start nodes', async () => {
            const order: string[] = []
            const db_token = Symbol.for('db')
            class CacheService {}

            loader.register(db_token, {
                on_start: async () => { order.push('db') },
                on_terminate: async () => undefined,
                on_load: () => undefined,
            })
            loader.record(CacheService, [db_token])
            loader.on_start(CacheService, async () => {
                order.push('cache')
            })

            await loader.start()
            expect(order).toEqual(['db', 'cache'])
        })

        it('should propagate deps through intermediate nodes without hooks', async () => {
            const order: string[] = []
            class Database {}
            class Repository {}
            class CacheService {}

            loader.record(Database, [])
            loader.on_start(Database, async () => { order.push('db') })
            loader.record(Repository, [Database])
            loader.record(CacheService, [Repository])
            loader.on_start(CacheService, async () => { order.push('cache') })

            await loader.start()
            expect(order).toEqual(['db', 'cache'])
        })

        it('should ignore null/undefined deps', async () => {
            const order: string[] = []
            class A {}

            loader.record(A, [null, undefined])
            loader.on_start(A, async () => { order.push('A') })

            await loader.start()
            expect(order).toEqual(['A'])
        })

        it('should ignore self-referencing deps', async () => {
            const order: string[] = []
            class A {}

            loader.record(A, [A])
            loader.on_start(A, async () => { order.push('A') })

            await loader.start()
            expect(order).toEqual(['A'])
        })
    })
})
