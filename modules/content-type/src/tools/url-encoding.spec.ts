/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { URLEncoding } from './url-encoding'

chai.use(cap)

describe('url-encoding.ts', function() {

    describe('URLEncoding', function() {

        describe('#parse()', function() {

            it('should parse string to object', async function() {
                const res = URLEncoding.parse('a=1&b=ccc%E9%98%BF%E9%87%8C%E7%A9%BA%E9%97%B4&b=%E7%A7%A6%E5%A7%8B%E7%9A%87&b=c')
                expect(res).to.eql({ a: '1', b: ['ccc阿里空间', '秦始皇', 'c'] })
            })

            it('should parse string to object in utf-8', async function() {
                const res = URLEncoding.parse('a=1&b=ccc%E9%98%BF%E9%87%8C%E7%A9%BA%E9%97%B4&b=%E7%A7%A6%E5%A7%8B%E7%9A%87&b=c', { charset: 'utf-8' })
                expect(res).to.eql({ a: '1', b: ['ccc阿里空间', '秦始皇', 'c'] })
            })

            it('should parse string to object in gbk', async function() {
                const res = URLEncoding.parse('a=1&b=ccc%b0%a2%c0%ef%bf%d5%bc%e4&b=%c7%d8%ca%bc%bb%ca&b=c', { charset: 'gbk' })
                expect(res).to.eql({ a: '1', b: ['ccc阿里空间', '秦始皇', 'c'] })
            })

            it('should parse string to object in big5', async function() {
                const res = URLEncoding.parse('a=1&b=ccc%aa%fc%a8%bd%aa%c5%9a%56&b=%af%b3%a9%6c%ac%d3&b=c', { charset: 'big5' })
                expect(res).to.eql({ a: '1', b: ['ccc阿里空间', '秦始皇', 'c'] })
            })

            it('should parse string to object in unknown charset', async function() {
                const res = URLEncoding.parse('a=1&b=ccc%aa%fc%a8%bd%aa%c5%9a%56&b=%af%b3%a9%6c%ac%d3&b=c', { charset: 'unknown' })
                expect(res).to.eql({ a: '1', b: ['ccc%aa%fc%a8%bd%aa%c5%9a%56', '%af%b3%a9%6c%ac%d3', 'c'] })
            })

            it('should limit keys', async function() {
                const res = URLEncoding.parse('a=1&b=1&c=1&d=1', { max_keys: 3 })
                expect(res).to.eql({ a: '1', b: '1', c: '1' })
            })

            it('should cancel limit by specified max_keys as negative number', async function() {
                const res = URLEncoding.parse('a=1&b=1&c=1&d=1', { max_keys: -1 })
                expect(res).to.eql({ a: '1', b: '1', c: '1', d: '1' })
            })

            it('should parse a= to { a: "" }', async function() {
                const res = URLEncoding.parse('a=')
                expect(res).to.eql({ a: '' })
            })
        })

        describe('#stringify()', function() {

            it('should encode object to string', async function() {
                const res = URLEncoding.stringify({ a: '1', b: ['ccc阿里空间', '秦始皇', 'c'] })
                expect(res).to.equal('a=1&b=ccc%E9%98%BF%E9%87%8C%E7%A9%BA%E9%97%B4&b=%E7%A7%A6%E5%A7%8B%E7%9A%87&b=c')
            })

            it('should encode object to string in utf-8', async function() {
                const res = URLEncoding.stringify({ a: '1', b: ['ccc阿里空间', '秦始皇', 'c'] }, 'utf-8')
                expect(res).to.equal('a=1&b=ccc%E9%98%BF%E9%87%8C%E7%A9%BA%E9%97%B4&b=%E7%A7%A6%E5%A7%8B%E7%9A%87&b=c')
            })

            it('should encode object to string in gbk', async function() {
                const res = URLEncoding.stringify({ a: '1', b: ['ccc阿里空间', '秦始皇', 'c'] }, 'gbk')
                expect(res).to.equal('a=1&b=%63%63%63%b0%a2%c0%ef%bf%d5%bc%e4&b=%c7%d8%ca%bc%bb%ca&b=c')
            })

            it('should encode object to string in big5', async function() {
                const res = URLEncoding.stringify({ a: '1', b: ['ccc阿里空间', '秦始皇', 'c'] }, 'big5')
                expect(res).to.equal('a=1&b=%63%63%63%aa%fc%a8%bd%aa%c5%9a%56&b=%af%b3%a9%6c%ac%d3&b=c')
            })

            it('should encode empty value as empty string', async function() {
                const res = URLEncoding.stringify({ a: '1', b: ['ccc阿里空间', '秦始皇', 'c'], u: undefined })
                expect(res).to.equal('a=1&b=ccc%E9%98%BF%E9%87%8C%E7%A9%BA%E9%97%B4&b=%E7%A7%A6%E5%A7%8B%E7%9A%87&b=c&u=')
            })
        })
    })
})
