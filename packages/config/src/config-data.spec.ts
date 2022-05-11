import chai, { expect } from 'chai'
import cap from 'chai-as-promised'
import { ConfigData, TpConfigSchema } from './config-data'

chai.use(cap)

declare module './config-data' {
    export interface TpConfigSchema {
        a: number
        b: string
        c: {
            c1: string
            c2: number
        }
    }
}

describe('ConfigData', function() {

    const data: TpConfigSchema = {
        a: 123,
        b: 'alibaba',
        c: {
            c1: 'bilibili',
            c2: 578,
        }
    }
    let config_data = new ConfigData(data)

    before(function() {
    })

    after(async function() {
    })

    describe('new ConfigData()', function() {

        it('should create ConfigData from object.', async function() {

            expect(config_data).to.be.instanceof(ConfigData)
        })

        it('should get whole config data if no field specified.', async function() {
            const res = config_data.get()
            expect(res).to.have.property('a', 123)
            expect(res).to.have.property('b', 'alibaba')
        })

        it('should get sub field of config data.', async function() {
            expect(config_data.get('a')).to.be.equal(123)
            expect(config_data.get('b')).to.be.equal('alibaba')
            expect(config_data.get('c.c1')).to.be.equal('bilibili')
            expect(config_data.get('c.c2')).to.be.equal(578)
        })
    })
})
