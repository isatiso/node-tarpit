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
import { text_deserialize } from './text'

chai.use(cap)

describe('text.ts', function() {

    describe('#text_deserialize()', function() {

        const null_content: MIMEContent<any> = {
            type: 'text/plain',
            charset: undefined,
            parameters: {},
            // {"a":"阿水淀粉","b":"起来，不愿做奴隶的人们"}
            raw: Buffer.from('eyJhIjoi6Zi/5rC05reA57KJIiwiYiI6Iui1t+adpe+8jOS4jeaEv+WBmuWltOmatueahOS6uuS7rCJ9', 'base64')
        }

        const utf8_content: MIMEContent<any> = {
            type: 'text/plain',
            charset: 'utf-8',
            parameters: { charset: 'utf-8', },
            // {"a":"阿水淀粉","b":"起来，不愿做奴隶的人们"}
            raw: Buffer.from('eyJhIjoi6Zi/5rC05reA57KJIiwiYiI6Iui1t+adpe+8jOS4jeaEv+WBmuWltOmatueahOS6uuS7rCJ9', 'base64')
        }

        const gbk_content: MIMEContent<any> = {
            type: 'text/plain',
            charset: 'gbk',
            parameters: { charset: 'gbk', },
            // a=阿水淀粉&b=起来，不愿做奴隶的人们&b=1&b=23
            raw: Buffer.from('YT2wosuute232yZiPcbwwLSjrLK71LjX9sWrwaW1xMjLw8cmYj0xJmI9MjM=', 'base64')
        }

        const non_exists_encoding_content: MIMEContent<any> = {
            type: 'text/plain',
            charset: 'whatever',
            parameters: { charset: 'whatever', },
            raw: Buffer.from('')
        }

        it('should decode utf8 content into text', function() {
            const text = text_deserialize(utf8_content)
            expect(text).to.equal('{"a":"阿水淀粉","b":"起来，不愿做奴隶的人们"}')
        })

        it('should decode gbk content into text', function() {
            const text = text_deserialize(gbk_content)
            expect(text).to.equal('a=阿水淀粉&b=起来，不愿做奴隶的人们&b=1&b=23')
        })

        it('should decode content default by utf8 into text', function() {
            const text = text_deserialize(null_content)
            expect(text).to.equal('{"a":"阿水淀粉","b":"起来，不愿做奴隶的人们"}')
        })

        it('should return undefined if given charset is unknown', function() {
            const text = text_deserialize(non_exists_encoding_content)
            expect(text).to.be.undefined
        })
    })
})
