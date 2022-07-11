/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { MIMEContent } from '../types'
import { form_deserialize } from './form'

chai.use(cap)

describe('form.ts', function() {

    describe('#form_deserialize()', function() {

        const null_content: MIMEContent<any> = {
            type: 'application/x-www-form-urlencoded',
            charset: undefined,
            parameters: {},
            // a=阿水淀粉&b=起来，不愿做奴隶的人们
            raw: Buffer.from('YT3pmL/msLTmt4DnsokmYj3otbfmnaXvvIzkuI3mhL/lgZrlpbTpmrbnmoTkurrku6w=', 'base64')
        }

        const utf8_content: MIMEContent<any> = {
            type: 'application/x-www-form-urlencoded',
            charset: 'utf-8',
            parameters: { charset: 'utf-8', },
            // a=阿水淀粉&b=起来，不愿做奴隶的人们
            raw: Buffer.from('YT3pmL/msLTmt4DnsokmYj3otbfmnaXvvIzkuI3mhL/lgZrlpbTpmrbnmoTkurrku6w=', 'base64')
        }

        const gbk_content: MIMEContent<any> = {
            type: 'application/x-www-form-urlencoded',
            charset: 'gbk',
            parameters: { charset: 'gbk', },
            // a=阿水淀粉&b=起来，不愿做奴隶的人们&b=1&b=2
            raw: Buffer.from('YT2wosuute232yZiPcbwwLSjrLK71LjX9sWrwaW1xMjLw8cmYj0xJmI9MjM=', 'base64')
        }

        const non_exists_encoding_content: MIMEContent<any> = {
            type: 'application/x-www-form-urlencoded',
            charset: 'whatever',
            parameters: { charset: 'whatever', },
            raw: Buffer.from('')
        }

        it('should decode utf8 urlencoded content into object', function() {
            const obj = form_deserialize(utf8_content)
            expect(obj).to.eql({ a: '阿水淀粉', b: '起来，不愿做奴隶的人们' })
        })

        it('should decode gbk urlencoded content into object', function() {
            const obj = form_deserialize(gbk_content)
            expect(obj).to.eql({ a: '阿水淀粉', b: ['起来，不愿做奴隶的人们', '1', '23'] })
        })

        it('should decode content default by utf8 into object', function() {
            const obj = form_deserialize(null_content)
            expect(obj).to.eql({ a: '阿水淀粉', b: '起来，不愿做奴隶的人们' })
        })

        it('should return undefined if given charset is unknown', function() {
            const obj = form_deserialize(non_exists_encoding_content)
            expect(obj).to.be.undefined
        })
    })
})
