/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { describe, expect, it } from 'vitest'
import { Guard, TpRequest } from '../builtin'
import { HttpAuthenticator } from './http-authenticator'

describe('http-authenticator.ts', function() {

    describe('HttpAuthenticator', function() {

        function mock_request(headers: any): TpRequest {
            return {
                headers: { ...headers } as any,
                get(key: string) {
                    return this.headers[key.toLowerCase()]
                }
            } as any
        }

        const auth = new HttpAuthenticator()

        describe('.get_credentials()', function() {

            it('should parse header Authorization', async function() {
                const request = mock_request({ 'authorization': 'Basic YWxhZGRpbjpvcGVuc2VzYW1l' })
                const credentials = await auth.get_credentials(request)
                expect(credentials).toEqual({ type: 'Basic', credentials: 'YWxhZGRpbjpvcGVuc2VzYW1l' })
            })

            it('should return undefined if parse failed', async function() {
                const request = mock_request({})
                const credentials = await auth.get_credentials(request)
                expect(credentials).toBeUndefined()
            })
        })

        describe('.authenticate()', function() {

            it('should check given Guard', async function() {
                await expect(auth.authenticate(new Guard({ type: 'Basic', credentials: 'YWxhZGRpbjpvcGVuc2VzYW1l' }))).resolves.toBeUndefined()
                await expect(auth.authenticate(new Guard(undefined))).rejects.toThrow()
            })
        })
    })
})
