/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { AcceptParser, ext_to_mime } from './accept-parser'

chai.use(cap)

describe('accept-parser.ts', function() {

    describe('#ext_to_mime()', function() {

        it('should convert ext of filename to MIME type', function() {
            expect(ext_to_mime('json')).to.equal('application/json')
            expect(ext_to_mime('txt')).to.equal('text/plain')
            expect(ext_to_mime('whatever')).to.be.undefined
        })
    })

    describe('AcceptParser', function() {

        describe('.types()', function() {

            it('should return all accept types', function() {
                const parser = new AcceptParser({ headers: { 'accept': 'text/html;q=0.9, text/plain;q=1' } })
                expect(parser.types()).to.eql(['text/plain', 'text/html'])
            })

            it('should figure out best types from given array', function() {
                const parser = new AcceptParser({ headers: { 'accept': 'text/html;q=0.9, text/plain;q=1' } })
                expect(parser.types('text/html', 'text/plain', 'application/json')).to.equal('text/plain')
                expect(parser.types('application/octet-stream')).to.be.undefined
            })

            it('should return first given type if no accept header found', function() {
                const parser = new AcceptParser({ headers: {} })
                expect(parser.types('text/html', 'text/plain', 'application/json')).to.equal('text/html')
            })
        })
    })

    describe('.charsets()', function() {

        it('should return all accept charsets', function() {
            const parser = new AcceptParser({ headers: { 'accept-charset': 'utf-8;q=0.9, gbk;q=1' } })
            expect(parser.charsets()).to.eql(['gbk', 'utf-8'])
        })

        it('should figure out best charsets from given array', function() {
            const parser = new AcceptParser({ headers: { 'accept-charset': 'utf-8;q=0.9, gbk;q=1' } })
            expect(parser.charsets('utf-8')).to.equal('utf-8')
            expect(parser.charsets('gb2312')).to.be.undefined
        })
    })

    describe('.encodings()', function() {

        it('should return all accept encodings', function() {
            const parser = new AcceptParser({ headers: { 'accept-encoding': 'br;q=1.0, gzip;q=0.8, *;q=0.1' } })
            expect(parser.encodings()).to.eql(['br', 'gzip', '*'])
        })

        it('should figure out best encodings from given array', function() {
            const parser = new AcceptParser({ headers: { 'accept-encoding': 'br;q=1.0, gzip;q=0.8' } })
            expect(parser.encodings('br', 'gzip')).to.equal('br')
            expect(parser.encodings('deflate')).to.be.undefined
        })
    })

    describe('.languages()', function() {

        it('should return all accept languages', function() {
            const parser = new AcceptParser({ headers: { 'accept-language': 'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5' } })
            expect(parser.languages()).to.eql(['fr-CH', 'fr', 'en', 'de', '*'])
        })

        it('should figure out best languages from given array', function() {
            const parser = new AcceptParser({ headers: { 'accept-language': 'fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7' } })
            expect(parser.languages('en', 'zh')).to.equal('en')
            expect(parser.languages('zh')).to.be.undefined
        })
    })
})
