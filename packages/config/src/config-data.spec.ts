import { describe, it, expect } from 'vitest'
import { ConfigData, TpConfigSchema } from './config-data'

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

describe('config-data.ts', function() {

    const data: TpConfigSchema = {
        a: 123,
        b: 'alibaba',
        c: {
            c1: 'bilibili',
            c2: 578,
        }
    }
    const config_data = new ConfigData(data)

    describe('ConfigData', function() {

        it('should create ConfigData from object.', async function() {
            expect(config_data).toBeInstanceOf(ConfigData)
        })

        it('should get whole config data if no field specified.', async function() {
            const res = config_data.get()
            expect(res).toHaveProperty('a', 123)
            expect(res).toHaveProperty('b', 'alibaba')
        })

        it('should get sub field of config data.', async function() {
            expect(config_data.get('a')).toEqual(123)
            expect(config_data.get('b')).toEqual('alibaba')
            expect(config_data.get('c.c1')).toEqual('bilibili')
            expect(config_data.get('c.c2')).toEqual(578)
        })
    })
})
