/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { ApiMethod } from '../__types__'
import { HandlerBook } from './handler-book'

chai.use(cap)

describe('handler-book.ts', function() {

    describe('HandlerBook', function() {

        describe('.record()', function() {

            it('should record handler of specified path and method', function() {
                const book = new HandlerBook()
                const some_path = '/some/path'
                const some_handler = async () => undefined
                expect(book.find('POST', some_path)).to.be.undefined
                book.record('POST', some_path, some_handler)
                expect(book.find('POST', some_path)).to.equal(some_handler)
            })

            it('should record method to allows array', function() {
                const book = new HandlerBook()
                const some_path = '/some/path'
                const some_handler = async () => undefined
                book.record('POST', some_path, some_handler)
                expect(book.get_allow(some_path)).to.contain('POST')
            })

            it('should record HEAD to allows array if given method is GET', function() {
                const book = new HandlerBook()
                const some_path = '/some/path'
                const some_handler = async () => undefined
                book.record('GET', some_path, some_handler)
                expect(book.get_allow(some_path)).to.have.contain('HEAD')
            })

            it('should record include method OPTIONS in allows array', function() {
                const book = new HandlerBook()
                const some_path = '/some/path'
                const some_handler = async () => undefined
                book.record('GET', some_path, some_handler)
                expect(book.get_allow(some_path)).to.contain('OPTIONS')
            })

            it('should prevent to add duplicated method to allows array', function() {
                const book = new HandlerBook()
                const some_path = '/some/path'
                const some_handler = async () => undefined
                book.record('POST', some_path, some_handler)
                book.record('POST', some_path, some_handler)
                expect(book.get_allow(some_path)).to.have.members(['OPTIONS', 'POST'])
            })
        })

        describe('.find()', function() {

            const book = new HandlerBook()
            const data: [ApiMethod, string, any][] = [
                ['POST', '/some/c', async () => undefined],
                ['GET', '/some/d', async () => undefined],
            ]

            for (const d of data) {
                book.record(d[0], d[1], d[2])
            }

            it('should find and return handler of given path and method', function() {
                expect(book.find('GET', '/some/d')).to.equal(data[1][2])
                expect(book.find('POST', '/some/c')).to.equal(data[0][2])
            })

            it('should find handler of method GET and specified path if given method is HEAD', function() {
                expect(book.find('HEAD', '/some/d')).to.equal(data[1][2])
            })

            it('should return undefined if handler not found', function() {
                expect(book.find('DELETE', '/some/d')).to.be.undefined
                expect(book.find('HEAD', '/some/c')).to.be.undefined
                expect(book.find('HEAD', '/not/found')).to.be.undefined
            })
        })

        describe('.get_allow()', function() {

            const book = new HandlerBook()
            const data: [ApiMethod, string, any][] = [
                ['GET', '/some/path', async () => undefined],
                ['POST', '/some/path', async () => undefined],
            ]

            for (const d of data) {
                book.record(d[0], d[1], d[2])
            }

            it('should return allows array of specified path', function() {
                expect(book.get_allow('/some/path')).to.have.members(['OPTIONS', 'HEAD', 'GET', 'POST'])
            })

            it('should return undefined if not found', function() {
                expect(book.get_allow('/not/found')).to.be.undefined
            })
        })

        describe('.list()', function() {

            it('should return array of method and path', function() {
                const book = new HandlerBook()
                const data: [ApiMethod, string, any][] = [
                    ['GET', '/some/path', async () => undefined],
                    ['POST', '/some/path', async () => undefined],
                    ['POST', '/some/c', async () => undefined],
                    ['GET', '/some/d', async () => undefined],
                ]

                for (const d of data) {
                    book.record(d[0], d[1], d[2])
                }

                expect(book.list()).to.eql([
                    { method: 'POST', path: '/some/c' },
                    { method: 'GET', path: '/some/d' },
                    { method: 'GET', path: '/some/path' },
                    { method: 'POST', path: '/some/path' },
                ])
            })
        })
    })
})
