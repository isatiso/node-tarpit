/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import chai_spies from 'chai-spies'
import { HttpInspector } from './http-inspector'

chai.use(cap)
chai.use(chai_spies)

describe('http-inspector.ts', function() {

    describe('HttpInspector', function() {

        describe('.list()', function() {

            it('should deliver call to HttpHandlerBook', function() {
                const mock_book = {}
                const spy_list = chai.spy.on(mock_book, 'list', () => undefined)
                const inspector = new HttpInspector({ handler_book: mock_book } as any)
                inspector.list_router()
                expect(spy_list).to.have.been.called.once
            })
        })

        describe('.bind()', function() {

            it('should deliver call to HttpHandlerBook', function() {
                const mock_book = {}
                const spy_record = chai.spy.on(mock_book, 'record', () => undefined)
                const inspector = new HttpInspector({ handler_book: mock_book } as any)
                const some_handler = async () => undefined
                inspector.bind('GET', '/some/path', some_handler)
                expect(spy_record).to.have.been.called.with('GET', '/some/path', some_handler)
            })
        })
    })
})
