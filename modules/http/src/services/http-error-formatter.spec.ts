/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData } from '@tarpit/config'
import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import chai_spies from 'chai-spies'
import { TpHttpError } from '../errors'
import { HttpErrorFormatter } from './http-error-formatter'

chai.use(cap)
chai.use(chai_spies)

describe('http-error-formatter.ts', function() {

    describe('HttpErrorFormatter', function() {

        const et = new HttpErrorFormatter(new ConfigData({ http: { expose_error: true } } as any))
        const ef = new HttpErrorFormatter(new ConfigData({ http: { expose_error: false } } as any))

        describe('.format()', function() {

            it('should format error as simple', async function() {
                const err = new TpHttpError({ code: 'ERR', msg: 'some error message', status: 500 })
                expect(ef.format(null as any, err)).to.eql({ error: { code: 'ERR', msg: 'Internal Server Error' } })
            })

            it('should format error as expose', function() {
                const err = new TpHttpError({ code: 'ERR', msg: 'some error message', status: 500 })
                expect(et.format(null as any, err)).to.eql({
                    error: {
                        body: '',
                        code: 'ERR',
                        detail: undefined,
                        headers: {},
                        msg: 'some error message',
                        stack: '',
                        status: 500,
                    }
                })
            })
        })
    })
})
