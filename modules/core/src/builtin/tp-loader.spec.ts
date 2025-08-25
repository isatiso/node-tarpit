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
    })
})
