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
import { json_deserialize } from './json'

chai.use(cap)

describe('json.ts', function() {

    describe('#json_deserialize()', function() {
        const null_content: MIMEContent<any> = {
            type: 'application/json',
            charset: undefined,
            parameters: {},
            // {"a":"阿水淀粉","b":"起来，不愿做奴隶的人们"}
            raw: Buffer.from('eyJhIjoi6Zi/5rC05reA57KJIiwiYiI6Iui1t+adpe+8jOS4jeaEv+WBmuWltOmatueahOS6uuS7rCJ9', 'base64')
        }

        const utf8_content: MIMEContent<any> = {
            type: 'application/json',
            charset: 'utf-8',
            parameters: { charset: 'utf-8', },
            // {"a":"阿水淀粉","b":"起来，不愿做奴隶的人们"}
            raw: Buffer.from('eyJhIjoi6Zi/5rC05reA57KJIiwiYiI6Iui1t+adpe+8jOS4jeaEv+WBmuWltOmatueahOS6uuS7rCJ9', 'base64')
        }

        const gbk_content: MIMEContent<any> = {
            type: 'application/json',
            charset: 'gbk',
            parameters: { charset: 'gbk', },
            // {"a":"阿水淀粉","b":"起来，不愿做奴隶的人们"}
            raw: Buffer.from('eyJhIjoisKLLrrXtt9siLCJiIjoixvDAtKOssrvUuNf2xavBpbXEyMvDxyJ9', 'base64')
        }

        const non_exists_encoding_content: MIMEContent<any> = {
            type: 'application/json',
            charset: 'whatever',
            parameters: { charset: 'whatever', },
            // {"a":"阿水淀粉","b":"起来，不愿做奴隶的人们"}
            raw: Buffer.from('')
        }

        const broken_content: MIMEContent<any> = {
            type: 'application/json',
            charset: 'utf8',
            parameters: { charset: 'utf8', },
            // {"a":"阿水淀粉
            raw: Buffer.from('eyJhIjoi6Zi/5rC05reA57KJ')
        }

        it('should decode utf8 urlencoded content into object', function() {
            const obj = json_deserialize(utf8_content)
            expect(obj).to.eql({ a: '阿水淀粉', b: '起来，不愿做奴隶的人们' })
        })

        it('should decode gbk urlencoded content into object', function() {
            const obj = json_deserialize(gbk_content)
            expect(obj).to.eql({ a: '阿水淀粉', b: '起来，不愿做奴隶的人们' })
        })

        it('should decode content default by utf8 into object', function() {
            const obj = json_deserialize(null_content)
            expect(obj).to.eql({ a: '阿水淀粉', b: '起来，不愿做奴隶的人们' })
        })

        it('should return undefined if given charset is unknown', function() {
            const obj = json_deserialize(non_exists_encoding_content)
            expect(obj).to.be.undefined
        })

        it('should return undefined if fail to parse json', function() {
            const obj = json_deserialize(broken_content)
            expect(obj).to.be.undefined
        })
    })
})
