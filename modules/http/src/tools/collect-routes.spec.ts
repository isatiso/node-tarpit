/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Disabled, get_class_decorator, Optional } from '@tarpit/core'
import { describe, expect, it } from 'vitest'
import { Auth, CacheUnder, Delete, Get, Post, Put, TpRouter, WS } from '../annotations'
import { collect_routes, RequestUnit, SocketUnit } from './collect-routes'

describe('collect-routes.ts', function() {

    describe('#collect_routes()', function() {

        it('should collect units from router meta', function() {

            @TpRouter('/')
            class TestRouter {

                @CacheUnder('scope', 3600)
                @Get()
                async user() {
                }

                @Post('add-user')
                async add_user() {
                }

                @Put()
                async modify_user() {
                }

                @Delete()
                async delete_user() {
                }

                @Post()
                @Disabled()
                async disabled_get_user() {

                }

                @WS()
                async subscribe_user() {
                }

                @WS()
                @Auth()
                async subscribe_user_need_auth() {
                }

                @WS()
                @Disabled()
                async disabled_subscribe_user() {
                }
            }

            const router_meta = get_class_decorator(TestRouter).find(token => token instanceof TpRouter)
            expect(router_meta).toBeDefined()
            const all_units = collect_routes(router_meta!)
            const request_units = all_units.filter((value): value is RequestUnit => value.type === 'request')
            const socket_units = all_units.filter((value): value is SocketUnit => value.type === 'socket')
            expect(request_units).toHaveLength(4)

            expect(request_units[0].path_tail).toEqual('user')
            expect(request_units[0].methods).toBeInstanceOf(Set)
            expect(Array.from(request_units[0].methods)).toEqual(['GET'])
            expect(request_units[0].cache_scope).toEqual('scope')
            expect(request_units[0].cache_expire_secs).toEqual(3600)

            expect(request_units[1].path_tail).toEqual('add-user')
            expect(request_units[1].methods).toBeInstanceOf(Set)
            expect(Array.from(request_units[1].methods)).toEqual(['POST'])
            expect(request_units[1].cache_scope).toEqual('')
            expect(request_units[1].cache_expire_secs).toEqual(0)

            expect(socket_units).toHaveLength(2)

            expect(socket_units[0].path_tail).toEqual('subscribe_user')
            expect(socket_units[0].auth).toBe(false)

            expect(socket_units[1].path_tail).toEqual('subscribe_user_need_auth')
            expect(socket_units[1].auth).toBe(true)
        })

        it('should return empty array if given router meta has no unit', function() {

            @TpRouter('/')
            class TestRouter {
            }

            const router_meta = get_class_decorator(TestRouter).find(token => token instanceof TpRouter)
            expect(router_meta).toBeDefined()
            const units = collect_routes(router_meta!)
            expect(units).toHaveLength(0)
        })

        it('should discard unit if its value is not function', function() {

            @TpRouter('/')
            class TestRouter {
                @Get()
                m: string = 'asd'
            }

            const router_meta = get_class_decorator(TestRouter).find(token => token instanceof TpRouter)
            expect(router_meta).toBeDefined()
            const units = collect_routes(router_meta!)
            expect(units).toHaveLength(0)
        })

        it('should ignore unknown decorator', function() {

            @TpRouter('/')
            class TestRouter {
                @Get()
                @Optional()
                async user() {
                }

                @WS()
                @Optional()
                async subscribe_user() {
                }
            }

            const router_meta = get_class_decorator(TestRouter).find(token => token instanceof TpRouter)
            expect(router_meta).toBeDefined()
            const units = collect_routes(router_meta!)
            expect(units).toHaveLength(2)
        })

        it('should ignore units if its decorators contain no route decorator', function() {

            @TpRouter('/')
            class TestRouter {

                @CacheUnder('scope', 3600)
                async user() {
                }
            }

            const router_meta = get_class_decorator(TestRouter).find(token => token instanceof TpRouter)
            expect(router_meta).toBeDefined()
            const units = collect_routes(router_meta!)
            expect(units).toHaveLength(0)
        })

        it('should throw error if request decorator and socket decorator on the same method', function() {
            @TpRouter('/')
            class TestRouter {

                @Get()
                @WS()
                async user() {
                }
            }

            const router_meta = get_class_decorator(TestRouter).find(token => token instanceof TpRouter)
            expect(router_meta).toBeDefined()
            expect(() => collect_routes(router_meta!)).toThrow('Request decorator is conflict with socket decorator on TestRouter.user')
        })
    })
})
