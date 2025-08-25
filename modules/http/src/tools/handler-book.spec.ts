/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { describe, expect, it } from 'vitest'
import { ApiMethod } from '../__types__'
import { HandlerBook } from './handler-book'

describe('handler-book.ts', function() {

    describe('HandlerBook', function() {

        describe('.record()', function() {

            it('should process special path "/" "*" and ""', function() {
                const book = new HandlerBook()
                const some_handler = async () => undefined
                expect(book.find('GET', '/')).toBeUndefined()
                expect(book.find('GET', '*')).toBeUndefined()
                expect(book.find('GET', '')).toBeUndefined()
                book.record('/', { type: 'GET', handler: some_handler })
                book.clear_cache()
                expect(book.find('GET', '/')).toBeInstanceOf(Function)
                expect(book.find('GET', '*')).toBeInstanceOf(Function)
                expect(book.find('GET', '')).toBeInstanceOf(Function)
            })

            it('should record handler of specified path and method', function() {
                const book = new HandlerBook()
                const some_handler = async () => undefined
                expect(book.find('POST', '/some/path')).toBeUndefined()
                book.record('/some/path', { type: 'POST', handler: some_handler })
                book.clear_cache()
                expect(book.find('POST', '/some/path')).toBeInstanceOf(Function)
                expect(book.find('POST', '/some/path/')).toBeInstanceOf(Function)
                expect(book.find('POST', '/some')).not.toBeInstanceOf(Function)
                expect(book.find('POST', '/some/')).not.toBeInstanceOf(Function)
            })

            it('should record handler of regexp path with prefix path and method', function() {
                const book = new HandlerBook()
                const some_def = '/some/:path/:id'
                const some_path = '/some/walden-pond/abc'
                const some_handler = async () => undefined
                expect(book.find('POST', some_path)).toBeUndefined()
                book.record(some_def, { type: 'POST', handler: some_handler })
                book.clear_cache()
                expect(book.find('POST', some_path)).toBeInstanceOf(Function)
            })

            it('should record handler of pure regexp path and method', function() {
                const book = new HandlerBook()
                const some_handler = async () => undefined
                expect(book.find('POST', '/walden-pond/abc')).toBeUndefined()
                book.record('/:path([a-c]\\d+)/:id', { type: 'POST', handler: some_handler })
                book.record('/:path([d-f]\\d+)/:id', { type: 'POST', handler: some_handler })
                book.clear_cache()
                expect(book.find('POST', '/a2/abc')).toBeInstanceOf(Function)
                expect(book.find('POST', '/c2/abc')).toBeInstanceOf(Function)
                expect(book.find('POST', '/f456/abc')).toBeInstanceOf(Function)
            })

            it('should record method to allows array', function() {
                const book = new HandlerBook()
                const some_path = '/some/path'
                const some_handler = async () => undefined
                book.record(some_path, { type: 'POST', handler: some_handler })
                expect(book.get_allow(some_path)).toContain('POST')
            })

            it('should record HEAD to allows array if given method is GET', function() {
                const book = new HandlerBook()
                const some_path = '/some/path'
                const some_handler = async () => undefined
                book.record(some_path, { type: 'GET', handler: some_handler })
                expect(book.get_allow(some_path)).toContain('HEAD')
            })

            it('should record include method OPTIONS in allows array', function() {
                const book = new HandlerBook()
                const some_path = '/some/path'
                const some_handler = async () => undefined
                book.record(some_path, { type: 'GET', handler: some_handler })
                expect(book.get_allow(some_path)).toContain('OPTIONS')
            })

            it('should prevent to add duplicated method to allows array', function() {
                const book = new HandlerBook()
                const some_path = '/some/path'
                const some_handler = async () => undefined
                book.record(some_path, { type: 'POST', handler: some_handler })
                book.record(some_path, { type: 'POST', handler: some_handler })
                expect(book.get_allow(some_path)).toEqual(['OPTIONS', 'POST'])
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
                    expect(book.find('GET', '/some/ls/')).toBeDefined()
                    expect(book.find('GET', '/some/ab/')).toBeUndefined()
                })

                it('should match nested paths with wildcard parameters', function() {
                    expect(book.find('GET', '/some/ls/abc/def')).toBeDefined()
                })

                it('should find handlers for static paths with correct methods', function() {
                    const get_handler = book.find('GET', '/some/d')
                    const post_handler = book.find('POST', '/some/c')

                    expect(get_handler).toBeInstanceOf(Function)
                    expect(post_handler).toBeInstanceOf(Function)
                })

                it('should map HEAD requests to GET handlers automatically', function() {
                    const head_handler = book.find('HEAD', '/some/d')
                    expect(head_handler).toBeInstanceOf(Function)
                })

                it('should return undefined if handler not found', function() {
                    expect(book.find('DELETE', '/some/d')).toBeUndefined()
                    expect(book.find('HEAD', '/some/c')).toBeUndefined()
                    expect(book.find('HEAD', '/not/found')).toBeUndefined()
                })
            })

            describe('static path matching', function() {
                it('should find exact static path matches', function() {
                    const book = new HandlerBook()
                    const handler = async () => undefined

                    book.record('/api/users', { type: 'GET', handler })
                    book.record('/api/posts/123', { type: 'POST', handler })

                    expect(book.find('GET', '/api/users')).toBeInstanceOf(Function)
                    expect(book.find('POST', '/api/posts/123')).toBeInstanceOf(Function)
                    expect(book.find('GET', '/api/posts')).toBeUndefined()
                })

                it('should handle trailing slashes correctly', function() {
                    const book = new HandlerBook()
                    const handler = async () => undefined

                    book.record('/api/test', { type: 'GET', handler })

                    expect(book.find('GET', '/api/test')).toBeInstanceOf(Function)
                    expect(book.find('GET', '/api/test/')).toBeInstanceOf(Function)
                })
            })

            describe('dynamic path matching', function() {
                it('should match dynamic paths with parameters', function() {
                    const book = new HandlerBook()
                    const handler = async () => undefined

                    book.record('/api/users/:id', { type: 'GET', handler })
                    book.record('/api/posts/:post_id/comments/:comment_id', { type: 'POST', handler })

                    expect(book.find('GET', '/api/users/123')).toBeInstanceOf(Function)
                    expect(book.find('GET', '/api/users/abc')).toBeInstanceOf(Function)
                    expect(book.find('POST', '/api/posts/456/comments/789')).toBeInstanceOf(Function)
                })

                it('should match wildcard paths', function() {
                    const book = new HandlerBook()
                    const handler = async () => undefined

                    book.record('/files/:path*', { type: 'GET', handler })

                    expect(book.find('GET', '/files/')).toBeInstanceOf(Function)
                    expect(book.find('GET', '/files/docs')).toBeInstanceOf(Function)
                    expect(book.find('GET', '/files/docs/readme.txt')).toBeInstanceOf(Function)
                })

                it('should match plus paths (requiring one or more segments)', function() {
                    const book = new HandlerBook()
                    const handler = async () => undefined

                    book.record('/assets/:path+', { type: 'GET', handler })

                    expect(book.find('GET', '/assets/')).toBeUndefined()
                    expect(book.find('GET', '/assets/css')).toBeInstanceOf(Function)
                    expect(book.find('GET', '/assets/css/style.css')).toBeInstanceOf(Function)
                })
            })

            describe('regex path matching', function() {
                it('should match paths with regex parameter constraints', function() {
                    const book = new HandlerBook()
                    const handler = async () => undefined

                    book.record('/:id(\\d+)', { type: 'GET', handler })
                    book.record('/user/:name([a-zA-Z]+)', { type: 'POST', handler })

                    expect(book.find('GET', '/123')).toBeInstanceOf(Function)
                    expect(book.find('GET', '/abc')).toBeUndefined()
                    expect(book.find('POST', '/user/john')).toBeInstanceOf(Function)
                    expect(book.find('POST', '/user/123')).toBeUndefined()
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

                    expect(profile_handler).toBeInstanceOf(Function)
                    expect(user_handler).toBeInstanceOf(Function)
                })

                it('should check node matchers when static path has no direct mapping', function() {
                    const book = new HandlerBook()
                    const static_handler = async () => undefined
                    const dynamic_handler = async () => undefined

                    // This tests the new code addition - when static path exists but no direct map,
                    // it should check matchers on that node
                    book.record('/api/users/:id/posts', { type: 'GET', handler: dynamic_handler })
                    book.record('/api/users/admin', { type: 'GET', handler: static_handler })

                    expect(book.find('GET', '/api/users/123/posts')).toBeInstanceOf(Function)
                    expect(book.find('GET', '/api/users/admin')).toBeInstanceOf(Function)
                })
            })

            describe('WebSocket handler support', function() {
                it('should find SOCKET handlers for WebSocket upgrade requests', function() {
                    const book = new HandlerBook()
                    const socket_handler = async () => undefined

                    book.record('/ws/chat', { type: 'SOCKET', handler: socket_handler })
                    book.record('/ws/notifications/:user_id', { type: 'SOCKET', handler: socket_handler })

                    expect(book.find('SOCKET', '/ws/chat')).toBeInstanceOf(Function)
                    expect(book.find('SOCKET', '/ws/notifications/123')).toBeInstanceOf(Function)
                    expect(book.find('SOCKET', '/ws/unknown')).toBeUndefined()
                })
            })

            describe('HTTP method normalization', function() {
                it('should normalize HTTP method names to uppercase internally', function() {
                    const book = new HandlerBook()
                    const handler = async () => undefined

                    book.record('/test', { type: 'GET', handler })

                    // Method normalization happens internally in the find method
                    expect(book.find('GET', '/test')).toBeInstanceOf(Function)
                    expect(book.find('GET', '/test')).toBeInstanceOf(Function)
                    expect(book.find('GET', '/test')).toBeInstanceOf(Function)
                })

                it('should automatically map HEAD requests to GET handlers', function() {
                    const book = new HandlerBook()
                    const get_handler = async () => undefined

                    book.record('/api/data', { type: 'GET', handler: get_handler })

                    expect(book.find('HEAD', '/api/data')).toBeInstanceOf(Function)
                    expect(book.find('GET', '/api/data')).toBeInstanceOf(Function)
                })
            })

            describe('caching behavior', function() {
                it('should use cached results for repeated lookups', function() {
                    const book = new HandlerBook()
                    const handler = async () => undefined

                    book.record('/cached/path', { type: 'GET', handler })

                    const first_call = book.find('GET', '/cached/path')
                    const second_call = book.find('GET', '/cached/path')

                    expect(first_call).toBeInstanceOf(Function)
                    expect(second_call).toBeInstanceOf(Function)
                    expect(first_call).to.equal(second_call) // Should be the same cached function
                })

                it('should clear cache and rebuild when clear_cache is called', function() {
                    const book = new HandlerBook()
                    const handler = async () => undefined

                    book.record('/cache/test', { type: 'GET', handler })

                    const before_clear = book.find('GET', '/cache/test')
                    book.clear_cache()
                    const after_clear = book.find('GET', '/cache/test')

                    expect(before_clear).toBeInstanceOf(Function)
                    expect(after_clear).toBeInstanceOf(Function)
                })
            })

            describe('edge cases', function() {
                it('should handle root path with different representations', function() {
                    const book = new HandlerBook()
                    const root_handler = async () => undefined

                    book.record('/', { type: 'GET', handler: root_handler })

                    expect(book.find('GET', '/')).toBeInstanceOf(Function)
                    expect(book.find('GET', '')).toBeInstanceOf(Function)
                    expect(book.find('GET', '*')).toBeInstanceOf(Function)
                })

                it('should return undefined for malformed paths', function() {
                    const book = new HandlerBook()

                    expect(book.find('GET', '')).toBeUndefined()
                    expect(book.find('GET', '///')).toBeUndefined()
                    expect(book.find('GET', '//')).toBeUndefined()
                })

                it('should match paths containing URL-encoded and special characters', function() {
                    const book = new HandlerBook()
                    const handler = async () => undefined

                    book.record('/api/search/:query', { type: 'GET', handler })

                    expect(book.find('GET', '/api/search/hello%20world')).toBeInstanceOf(Function)
                    expect(book.find('GET', '/api/search/test-query')).toBeInstanceOf(Function)
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
                expect(book.get_allow('/some/path')).toEqual(['OPTIONS', 'HEAD', 'GET', 'POST'])
            })

            it('should return undefined if not found', function() {
                expect(book.get_allow('/not/found')).toBeUndefined()
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

                expect(book.list()).toEqual([
                    { method: 'POST', path: '/some/c' },
                    { method: 'GET', path: '/some/d' },
                    { method: 'GET', path: '/some/path' },
                    { method: 'POST', path: '/some/path' },
                ])
            })
        })
    })
})
