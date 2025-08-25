/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { MIMEContent } from '@tarpit/content-type'
import { Jtl, Judgement } from '@tarpit/judge'
import { describe, expect, it } from 'vitest'
import { FormBody } from './form-body'

describe('form-body.ts', function() {

    const content: MIMEContent<any> = {
        type: 'application/x-www-form-urlencoded',
        charset: 'utf-8',
        parameters: { charset: 'utf-8' },
        raw: Buffer.from('a=1&b=黑龙江')
    }

    describe('FormBody', function() {

        it('should new instance', function() {
            const instance = new FormBody(content)
            expect(instance).toBeInstanceOf(Judgement)
            expect(instance.data).toEqual({ a: '1', b: '黑龙江' })
        })

        describe('#on_error()', function() {

            it('should be called when judgement not match', function() {
                const instance = new FormBody<{ a: string | number, b: string }>(content)
                expect(() => instance.ensure('a', Jtl.string)).not.toThrow()
                expect(() => instance.ensure('a', Jtl.number)).toThrow('Body parameter of [a] does not match the rule: [is number]')
            })

            it('should be use custom on_error function if given', function() {
                const instance = new FormBody<{ a: string | number, b: string }>(content)
                expect(() => instance.ensure('a', Jtl.number, (prop, desc) => `${prop} -> ${desc.rule}`))
                    .toThrow('a -> is number')
            })
        })
    })
})
