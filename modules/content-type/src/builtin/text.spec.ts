/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import fs from 'fs'
import { MIMEContent } from '../types'
import { text_deserialize } from './text'

chai.use(cap)

describe('text.ts', function() {

    const null_content: MIMEContent<any> = {
        type: 'application/json',
        charset: undefined,
        parameters: {},
        raw: fs.readFileSync('./assets/json-utf8.txt')
    }

    const utf8_content: MIMEContent<any> = {
        type: 'application/json',
        charset: 'utf-8',
        parameters: { charset: 'utf-8', },
        raw: fs.readFileSync('./assets/json-utf8.txt')
    }

    const gbk_content: MIMEContent<any> = {
        type: 'application/json',
        charset: 'gbk',
        parameters: { charset: 'gbk', },
        raw: fs.readFileSync('./assets/json-gbk.txt')
    }

    const non_exists_encoding_content: MIMEContent<any> = {
        type: 'application/json',
        charset: 'whatever',
        parameters: { charset: 'whatever', },
        raw: fs.readFileSync('./assets/json-gbk.txt')
    }

    describe('function text_deserialize()', function() {
        it('should decode utf8 content in MIMEContent', function() {
            const text = text_deserialize(utf8_content)
            expect(text).to.equal('{"a":"阿水淀粉","b":"起来，不愿做奴隶的人们"}')
        })

        it('should decode gbk content in MIMEContent', function() {
            const text = text_deserialize(gbk_content)
            expect(text).to.equal('{"a":"阿水淀粉","b":"起来，不愿做奴隶的人们"}')
        })

        it('should decode content default by utf8 in MIMEContent', function() {
            const text = text_deserialize(null_content)
            expect(text).to.equal('{"a":"阿水淀粉","b":"起来，不愿做奴隶的人们"}')
        })

        it('should return undefined if given charset is unknown', function() {
            const text = text_deserialize(non_exists_encoding_content)
            expect(text).to.be.undefined
        })
    })
})
