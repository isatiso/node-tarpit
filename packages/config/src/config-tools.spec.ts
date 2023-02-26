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
import { load_config } from './config-tools'

chai.use(cap)

describe('config-tools.ts', function() {

    describe('#load_config()', function() {

        it('should load file if nothing given.', function() {
            const data = {
                a: 123,
                b: 'string',
            }
            fs.writeFileSync('./tarpit.json', JSON.stringify(data))
            const config_data = load_config<typeof data>()
            expect(config_data.get('a')).to.equal(123)
            expect(config_data.get('b')).to.equal('string')
            fs.rmSync('./tarpit.json')
        })

        it('should throw error if nothing given and tarpit.json not exists.', function() {
            expect(() => load_config()).to.throw()
        })

        it('should load file from given path.', function() {
            const data = {
                a: 123,
                b: 'string'
            }
            fs.writeFileSync('./tmp-tarpit.spec.json', JSON.stringify(data))
            const config_data = load_config<typeof data>('./tmp-tarpit.spec.json')
            expect(config_data.get('a')).to.equal(123)
            expect(config_data.get('b')).to.equal('string')
            fs.rmSync('./tmp-tarpit.spec.json')
        })

        it('should throw error if given path is empty.', function() {
            fs.writeFileSync('./empty.spec.json', 'null')
            expect(() => load_config('./empty.spec.json')).to.throw()
            fs.rmSync('./empty.spec.json')
        })

        it('should throw error if given file is empty.', function() {
            expect(() => load_config('./non-exist.json')).to.throw()
        })

        it('should use data from given JSON.', function() {
            const data = {
                a: 123,
                b: 'string'
            }
            const config_data = load_config(data)
            expect(config_data.get('a')).to.equal(123)
            expect(config_data.get('b')).to.equal('string')
        })

        it('should use return value if given data is function.', function() {
            const data = {
                a: 123,
                b: 'string'
            }
            const config_data = load_config<typeof data>(() => data)
            expect(config_data.get('a')).to.equal(123)
            expect(config_data.get('b')).to.equal('string')
        })
    })
})
