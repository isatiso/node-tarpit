/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Disabled, get_class_decorator, Optional } from '@tarpit/core'
import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { CacheUnder, Delete, Get, Post, Put, TpRouter } from '../annotations'
import { collect_routes } from './collect-routes'

chai.use(cap)

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
            }

            const router_meta = get_class_decorator(TestRouter).find(token => token instanceof TpRouter)
            expect(router_meta).to.exist
            const units = collect_routes(router_meta)
            expect(units).to.be.an('array').with.lengthOf(4)

            expect(units[0]).to.have.property('path_tail').which.equal('user')
            expect(units[0].methods).to.be.instanceof(Set)
            expect(Array.from(units[0].methods)).to.eql(['GET'])
            expect(units[0]).to.have.property('cache_scope').which.equal('scope')
            expect(units[0]).to.have.property('cache_expire_secs').which.equal(3600)

            expect(units[1]).to.have.property('path_tail').which.equal('add-user')
            expect(units[1].methods).to.be.instanceof(Set)
            expect(Array.from(units[1].methods)).to.eql(['POST'])
            expect(units[1]).to.have.property('cache_scope').which.equal('')
            expect(units[1]).to.have.property('cache_expire_secs').which.equal(0)
        })

        it('should return empty array if given router meta has no unit', function() {

            @TpRouter('/')
            class TestRouter {
            }

            const router_meta = get_class_decorator(TestRouter).find(token => token instanceof TpRouter)
            expect(router_meta).to.exist
            const units = collect_routes(router_meta)
            expect(units).to.be.an('array').with.lengthOf(0)
        })

        it('should discard unit if its value is not function', function() {

            @TpRouter('/')
            class TestRouter {
                @Get()
                m: string = 'asd'
            }

            const router_meta = get_class_decorator(TestRouter).find(token => token instanceof TpRouter)
            expect(router_meta).to.exist
            const units = collect_routes(router_meta)
            expect(units).to.be.an('array').with.lengthOf(0)
        })

        it('should ignore unknown decorator', function() {

            @TpRouter('/')
            class TestRouter {
                @Get()
                @Optional()
                async user() {
                }
            }

            const router_meta = get_class_decorator(TestRouter).find(token => token instanceof TpRouter)
            expect(router_meta).to.exist
            const units = collect_routes(router_meta)
            expect(units).to.be.an('array').with.lengthOf(1)
        })

        it('should ignore units if its decorators contain no route decorator', function() {

            @TpRouter('/')
            class TestRouter {

                @CacheUnder('scope', 3600)
                async user() {
                }
            }

            const router_meta = get_class_decorator(TestRouter).find(token => token instanceof TpRouter)
            expect(router_meta).to.exist
            const units = collect_routes(router_meta)
            expect(units).to.be.an('array').with.lengthOf(0)
        })
    })
})
