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
import { Guard, TpRequest } from '../builtin'
import { HttpAuthenticator } from './http-authenticator'

chai.use(cap)
chai.use(chai_spies)

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
                expect(credentials).to.eql({ type: 'Basic', credentials: 'YWxhZGRpbjpvcGVuc2VzYW1l' })
            })

            it('should return undefined if parse failed', async function() {
                const request = mock_request({})
                const credentials = await auth.get_credentials(request)
                expect(credentials).to.be.undefined
            })
        })

        describe('.authenticate()', function() {

            it('should check given Guard', async function() {
                await expect(auth.authenticate(new Guard({ type: 'Basic', credentials: 'YWxhZGRpbjpvcGVuc2VzYW1l' }))).not.to.be.rejected
                await expect(auth.authenticate(new Guard(undefined))).to.be.rejected
            })
        })
    })
})
