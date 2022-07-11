/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { parse_content_type } from './parse-content-type'

chai.use(cap)

describe('parse-content-type.ts', function() {

    describe('#parse_content_type()', function() {

        it('should parse content type with charset', function() {
            expect(parse_content_type('application/json; charset=utf8')).to.eql({ type: 'application/json', parameters: { charset: 'utf8' } })
        })

        it('should parse content type with no parameters', function() {
            expect(parse_content_type('application/json')).to.eql({ type: 'application/json', parameters: {} })
        })

        it('should parse content type application/octet-stream if given type is not regular', function() {
            expect(parse_content_type('whatever')).to.eql({ type: 'application/octet-stream', parameters: {} })
        })

        it('should parse content type with quoted parameters', function() {
            expect(parse_content_type('application/json; charset=utf8; custom="\\""')).to.eql({
                type: 'application/json',
                parameters: { charset: 'utf8', custom: '"' }
            })
        })
    })
})
