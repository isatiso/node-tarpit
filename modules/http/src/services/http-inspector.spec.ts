/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { describe, expect, it, vi } from 'vitest'
import { HttpInspector } from './http-inspector'

describe('http-inspector.ts', function() {

    describe('HttpInspector', function() {

        describe('.list()', function() {

            it('should deliver call to HttpHandlerBook', function() {
                const mock_book = { list: () => undefined } as any
                const spy_list = vi.spyOn(mock_book, 'list')
                const inspector = new HttpInspector({ handler_book: mock_book } as any)
                inspector.list_router()
                expect(spy_list).toHaveBeenCalledOnce()
            })
        })

        describe('.bind()', function() {

            it('should deliver call to HttpHandlerBook', function() {
                const mock_book = { record: () => undefined } as any
                const spy_record = vi.spyOn(mock_book, 'record')
                const inspector = new HttpInspector({ handler_book: mock_book } as any)
                const some_handler = async () => undefined
                inspector.bind('GET', '/some/path', some_handler)
                expect(spy_record).toHaveBeenCalledWith('/some/path', { type: 'GET', handler: some_handler })
            })
        })
    })
})
