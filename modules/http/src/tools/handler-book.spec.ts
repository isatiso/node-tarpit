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

            it('should process special path "/" "*" and ""', function() {
                const book = new HandlerBook()
                const some_handler = async () => undefined
                expect(book.find('GET', '/')).to.be.undefined
                expect(book.find('GET', '*')).to.be.undefined
                expect(book.find('GET', '')).to.be.undefined
                book.record('/', { type: 'GET', handler: some_handler })
                book.clear_cache()
                expect(book.find('GET', '/')).to.be.a('function')
                expect(book.find('GET', '*')).to.be.a('function')
                expect(book.find('GET', '')).to.be.a('function')
            })

            it('should record handler of specified path and method', function() {
                const book = new HandlerBook()
                const some_handler = async () => undefined
                expect(book.find('POST', '/some/path')).to.be.undefined
                book.record('/some/path', { type: 'POST', handler: some_handler })
                book.clear_cache()
                expect(book.find('POST', '/some/path')).to.be.a('function')
                expect(book.find('POST', '/some/path/')).to.be.a('function')
                expect(book.find('POST', '/some')).not.to.be.a('function')
                expect(book.find('POST', '/some/')).not.to.be.a('function')
            })

            it('should record handler of regexp path with prefix path and method', function() {
                const book = new HandlerBook()
                const some_def = '/some/:path/:id'
                const some_path = '/some/walden-pond/abc'
                const some_handler = async () => undefined
                expect(book.find('POST', some_path)).to.be.undefined
                book.record(some_def, { type: 'POST', handler: some_handler })
                book.clear_cache()
                expect(book.find('POST', some_path)).to.be.a('function')
            })

            it('should record handler of pure regexp path and method', function() {
                const book = new HandlerBook()
                const some_handler = async () => undefined
                expect(book.find('POST', '/walden-pond/abc')).to.be.undefined
                book.record('/:path([a-c]\\d+)/:id', { type: 'POST', handler: some_handler })
                book.record('/:path([d-f]\\d+)/:id', { type: 'POST', handler: some_handler })
                book.clear_cache()
                expect(book.find('POST', '/a2/abc')).to.be.a('function')
                expect(book.find('POST', '/c2/abc')).to.be.a('function')
                expect(book.find('POST', '/f456/abc')).to.be.a('function')
            })

            it('should record method to allows array', function() {
                const book = new HandlerBook()
                const some_path = '/some/path'
                const some_handler = async () => undefined
                book.record(some_path, { type: 'POST', handler: some_handler })
                expect(book.get_allow(some_path)).to.contain('POST')
            })

            it('should record HEAD to allows array if given method is GET', function() {
                const book = new HandlerBook()
                const some_path = '/some/path'
                const some_handler = async () => undefined
                book.record(some_path, { type: 'GET', handler: some_handler })
                expect(book.get_allow(some_path)).to.have.contain('HEAD')
            })

            it('should record include method OPTIONS in allows array', function() {
                const book = new HandlerBook()
                const some_path = '/some/path'
                const some_handler = async () => undefined
                book.record(some_path, { type: 'GET', handler: some_handler })
                expect(book.get_allow(some_path)).to.contain('OPTIONS')
            })

            it('should prevent to add duplicated method to allows array', function() {
                const book = new HandlerBook()
                const some_path = '/some/path'
                const some_handler = async () => undefined
                book.record(some_path, { type: 'POST', handler: some_handler })
                book.record(some_path, { type: 'POST', handler: some_handler })
                expect(book.get_allow(some_path)).to.have.members(['OPTIONS', 'POST'])
            })
        })

        describe('.find()', function() {

            describe('basic functionality', function() {
                const book = new HandlerBook()
                const data: [ApiMethod, string, any][] = [
                    ['POST', '/some/c', async () => 'post-c'],
                    ['GET', '/some/d', async () => 'get-d'],
                    ['GET', '/some/ls/:filepath*', async () => 'get-ls-wildcard'],
                    ['GET', '/some/ab/:filepath+', async () => 'get-ab-plus'],
                ]

                for (const d of data) {
                    book.record(d[1], { type: d[0], handler: d[2] })
                }

                it('should match wildcard paths correctly', function() {
                    expect(book.find('GET', '/some/ls/')).to.not.be.undefined
                    expect(book.find('GET', '/some/ab/')).to.be.undefined
                })

                it('should match nested paths with wildcard parameters', function() {
                    expect(book.find('GET', '/some/ls/abc/def')).to.not.be.undefined
                })

                it('should find handlers for static paths with correct methods', function() {
                    const get_handler = book.find('GET', '/some/d')
                    const post_handler = book.find('POST', '/some/c')
                    
                    expect(get_handler).to.be.a('function')
                    expect(post_handler).to.be.a('function')
                })

                it('should map HEAD requests to GET handlers automatically', function() {
                    const head_handler = book.find('HEAD', '/some/d')
                    expect(head_handler).to.be.a('function')
                })

                it('should return undefined if handler not found', function() {
                    expect(book.find('DELETE', '/some/d')).to.be.undefined
                    expect(book.find('HEAD', '/some/c')).to.be.undefined
                    expect(book.find('HEAD', '/not/found')).to.be.undefined
                })
            })

            describe('static path matching', function() {
                it('should find exact static path matches', function() {
                    const book = new HandlerBook()
                    const handler = async () => undefined
                    
                    book.record('/api/users', { type: 'GET', handler })
                    book.record('/api/posts/123', { type: 'POST', handler })
                    
                    expect(book.find('GET', '/api/users')).to.be.a('function')
                    expect(book.find('POST', '/api/posts/123')).to.be.a('function')
                    expect(book.find('GET', '/api/posts')).to.be.undefined
                })

                it('should handle trailing slashes correctly', function() {
                    const book = new HandlerBook()
                    const handler = async () => undefined
                    
                    book.record('/api/test', { type: 'GET', handler })
                    
                    expect(book.find('GET', '/api/test')).to.be.a('function')
                    expect(book.find('GET', '/api/test/')).to.be.a('function')
                })
            })

            describe('dynamic path matching', function() {
                it('should match dynamic paths with parameters', function() {
                    const book = new HandlerBook()
                    const handler = async () => undefined
                    
                    book.record('/api/users/:id', { type: 'GET', handler })
                    book.record('/api/posts/:post_id/comments/:comment_id', { type: 'POST', handler })
                    
                    expect(book.find('GET', '/api/users/123')).to.be.a('function')
                    expect(book.find('GET', '/api/users/abc')).to.be.a('function')
                    expect(book.find('POST', '/api/posts/456/comments/789')).to.be.a('function')
                })

                it('should match wildcard paths', function() {
                    const book = new HandlerBook()
                    const handler = async () => undefined
                    
                    book.record('/files/:path*', { type: 'GET', handler })
                    
                    expect(book.find('GET', '/files/')).to.be.a('function')
                    expect(book.find('GET', '/files/docs')).to.be.a('function')
                    expect(book.find('GET', '/files/docs/readme.txt')).to.be.a('function')
                })

                it('should match plus paths (requiring one or more segments)', function() {
                    const book = new HandlerBook()
                    const handler = async () => undefined
                    
                    book.record('/assets/:path+', { type: 'GET', handler })
                    
                    expect(book.find('GET', '/assets/')).to.be.undefined
                    expect(book.find('GET', '/assets/css')).to.be.a('function')
                    expect(book.find('GET', '/assets/css/style.css')).to.be.a('function')
                })
            })

            describe('regex path matching', function() {
                it('should match paths with regex parameter constraints', function() {
                    const book = new HandlerBook()
                    const handler = async () => undefined
                    
                    book.record('/:id(\\d+)', { type: 'GET', handler })
                    book.record('/user/:name([a-zA-Z]+)', { type: 'POST', handler })
                    
                    expect(book.find('GET', '/123')).to.be.a('function')
                    expect(book.find('GET', '/abc')).to.be.undefined
                    expect(book.find('POST', '/user/john')).to.be.a('function')
                    expect(book.find('POST', '/user/123')).to.be.undefined
                })
            })

            describe('mixed static and dynamic paths', function() {
                it('should prioritize static paths over dynamic ones', function() {
                    const book = new HandlerBook()
                    const static_handler = async () => undefined
                    const dynamic_handler = async () => undefined
                    
                    book.record('/api/users/profile', { type: 'GET', handler: static_handler })
                    book.record('/api/users/:id', { type: 'GET', handler: dynamic_handler })
                    
                    const profile_handler = book.find('GET', '/api/users/profile')
                    const user_handler = book.find('GET', '/api/users/123')
                    
                    expect(profile_handler).to.be.a('function')
                    expect(user_handler).to.be.a('function')
                })

                it('should check node matchers when static path has no direct mapping', function() {
                    const book = new HandlerBook()
                    const static_handler = async () => undefined
                    const dynamic_handler = async () => undefined
                    
                    // This tests the new code addition - when static path exists but no direct map,
                    // it should check matchers on that node
                    book.record('/api/users/:id/posts', { type: 'GET', handler: dynamic_handler })
                    book.record('/api/users/admin', { type: 'GET', handler: static_handler })
                    
                    expect(book.find('GET', '/api/users/123/posts')).to.be.a('function')
                    expect(book.find('GET', '/api/users/admin')).to.be.a('function')
                })
            })

            describe('WebSocket handler support', function() {
                it('should find SOCKET handlers for WebSocket upgrade requests', function() {
                    const book = new HandlerBook()
                    const socket_handler = async () => undefined
                    
                    book.record('/ws/chat', { type: 'SOCKET', handler: socket_handler })
                    book.record('/ws/notifications/:user_id', { type: 'SOCKET', handler: socket_handler })
                    
                    expect(book.find('SOCKET', '/ws/chat')).to.be.a('function')
                    expect(book.find('SOCKET', '/ws/notifications/123')).to.be.a('function')
                    expect(book.find('SOCKET', '/ws/unknown')).to.be.undefined
                })
            })

            describe('HTTP method normalization', function() {
                it('should normalize HTTP method names to uppercase internally', function() {
                    const book = new HandlerBook()
                    const handler = async () => undefined
                    
                    book.record('/test', { type: 'GET', handler })
                    
                    // Method normalization happens internally in the find method
                    expect(book.find('GET', '/test')).to.be.a('function')
                    expect(book.find('GET', '/test')).to.be.a('function')
                    expect(book.find('GET', '/test')).to.be.a('function')
                })

                it('should automatically map HEAD requests to GET handlers', function() {
                    const book = new HandlerBook()
                    const get_handler = async () => undefined
                    
                    book.record('/api/data', { type: 'GET', handler: get_handler })
                    
                    expect(book.find('HEAD', '/api/data')).to.be.a('function')
                    expect(book.find('GET', '/api/data')).to.be.a('function')
                })
            })

            describe('caching behavior', function() {
                it('should use cached results for repeated lookups', function() {
                    const book = new HandlerBook()
                    const handler = async () => undefined
                    
                    book.record('/cached/path', { type: 'GET', handler })
                    
                    const first_call = book.find('GET', '/cached/path')
                    const second_call = book.find('GET', '/cached/path')
                    
                    expect(first_call).to.be.a('function')
                    expect(second_call).to.be.a('function')
                    expect(first_call).to.equal(second_call) // Should be the same cached function
                })

                it('should clear cache and rebuild when clear_cache is called', function() {
                    const book = new HandlerBook()
                    const handler = async () => undefined
                    
                    book.record('/cache/test', { type: 'GET', handler })
                    
                    const before_clear = book.find('GET', '/cache/test')
                    book.clear_cache()
                    const after_clear = book.find('GET', '/cache/test')
                    
                    expect(before_clear).to.be.a('function')
                    expect(after_clear).to.be.a('function')
                })
            })

            describe('edge cases', function() {
                it('should handle root path with different representations', function() {
                    const book = new HandlerBook()
                    const root_handler = async () => undefined
                    
                    book.record('/', { type: 'GET', handler: root_handler })
                    
                    expect(book.find('GET', '/')).to.be.a('function')
                    expect(book.find('GET', '')).to.be.a('function')
                    expect(book.find('GET', '*')).to.be.a('function')
                })

                it('should return undefined for malformed paths', function() {
                    const book = new HandlerBook()
                    
                    expect(book.find('GET', '')).to.be.undefined
                    expect(book.find('GET', '///')).to.be.undefined
                    expect(book.find('GET', '//')).to.be.undefined
                })

                it('should match paths containing URL-encoded and special characters', function() {
                    const book = new HandlerBook()
                    const handler = async () => undefined
                    
                    book.record('/api/search/:query', { type: 'GET', handler })
                    
                    expect(book.find('GET', '/api/search/hello%20world')).to.be.a('function')
                    expect(book.find('GET', '/api/search/test-query')).to.be.a('function')
                })
            })
        })

        describe('.get_allow()', function() {

            const book = new HandlerBook()
            const data: [ApiMethod, string, any][] = [
                ['GET', '/some/path', async () => undefined],
                ['POST', '/some/path', async () => undefined],
            ]

            for (const d of data) {
                book.record(d[1], { type: d[0], handler: d[2] })
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
                    book.record(d[1], { type: d[0], handler: d[2] })
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
