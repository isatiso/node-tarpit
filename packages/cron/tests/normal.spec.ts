import { describe, it, expect, vi } from 'vitest'
import { Cron } from '../src'

describe('normal case', function() {

    it('should generate date object according to "15 * * * *"', function() {
        vi.spyOn(Date, 'now').mockImplementation(() => 1658328606790)
        const cron = Cron.parse('15 * * * *', { tz: 'Asia/Shanghai' })
        expect(cron.next()?.format()).toEqual('2022-07-20T23:15:00.000+08:00')
        expect(cron.next()?.format()).toEqual('2022-07-21T00:15:00.000+08:00')
        expect(cron.next()?.format()).toEqual('2022-07-21T01:15:00.000+08:00')
    })
})
