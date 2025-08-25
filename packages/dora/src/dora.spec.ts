import { describe, it, expect } from 'vitest'
import { DateTimeArray, Dora } from './dora'

describe('dora.ts', function() {

    describe('Dora', function() {

        it('could new instance', function() {
            const date = new Dora(Date.now())
            expect(date).toBeInstanceOf(Dora)
        })

        describe('#guess_timezone()', function() {

            it('should return timezone of current area', function() {
                const m = Dora.guess_timezone()
                expect(m).toEqual(Intl.DateTimeFormat().resolvedOptions().timeZone)
            })
        })

        describe('#now()', function() {

            it('should return Dora object of current timestamp', function() {
                const m = Dora.now()
                expect(m.valueOf()).toBeCloseTo(Date.now(), -2)
            })
        })

        describe('#from()', function() {

            it('should return Dora as DateTimeArray specified', function() {
                const time_arr: DateTimeArray = [2020, 7, 8, 14, 32, 1, 332]
                const m = Dora.from(time_arr)
                expect(m.year()).toEqual(2020)
                expect(m.month()).toEqual(7)
                expect(m.date()).toEqual(8)
                expect(m.day()).toEqual(6)
                expect(m.hour()).toEqual(14)
                expect(m.minute()).toEqual(32)
                expect(m.second()).toEqual(1)
                expect(m.millisecond()).toEqual(332)
            })

            it('should deal with time when Standard time switch to DST case 1', function() {
                const time_arr: DateTimeArray = [2023, 2, 12, 2, 32]
                expect(() => Dora.from(time_arr, { timezone: 'America/New_York', strict: true })).toThrow()
                expect(Dora.from(time_arr, { timezone: 'America/New_York' })).toBeInstanceOf(Dora)
            })

            it('should deal with time when Standard time switch to DST case 2', function() {
                const time_arr: DateTimeArray = [2023, 9, 1, 2, 26]
                expect(() => Dora.from(time_arr, { timezone: 'Australia/Lord_Howe', strict: true })).toThrow()
                expect(Dora.from(time_arr, { timezone: 'Australia/Lord_Howe' })).toBeInstanceOf(Dora)
            })

            it('should deal with time when DST switch to Standard time switch case 1', function() {
                const time_arr: DateTimeArray = [2023, 10, 5, 2, 26]
                const m = Dora.from(time_arr, { timezone: 'America/New_York' })
                expect(m.year()).toEqual(2023)
                expect(m.month()).toEqual(10)
                expect(m.date()).toEqual(5)
                expect(m.hour()).toEqual(2)
                expect(m.minute()).toEqual(26)
            })

            it('should deal with time when DST switch to Standard time switch case 2', function() {
                const time_arr: DateTimeArray = [2023, 3, 2, 1, 36]
                const m = Dora.from(time_arr, { timezone: 'Australia/Lord_Howe' })
                expect(m.year()).toEqual(2023)
                expect(m.month()).toEqual(3)
                expect(m.date()).toEqual(2)
                expect(m.hour()).toEqual(1)
                expect(m.minute()).toEqual(36)
            })

            it('should deal with time DST time case 1', function() {
                const time_arr: DateTimeArray = [2023, 11, 1, 2, 26]
                const m = Dora.from(time_arr, { timezone: 'Australia/Lord_Howe' })
                expect(m.year()).toEqual(2023)
                expect(m.month()).toEqual(11)
                expect(m.date()).toEqual(1)
                expect(m.hour()).toEqual(2)
                expect(m.minute()).toEqual(26)
            })

            it('should deal with time DST time case 2', function() {
                const time_arr: DateTimeArray = [2023, 5, 1, 2, 26]
                const m = Dora.from(time_arr, { timezone: 'America/New_York' })
                expect(m.year()).toEqual(2023)
                expect(m.month()).toEqual(5)
                expect(m.date()).toEqual(1)
                expect(m.hour()).toEqual(2)
                expect(m.minute()).toEqual(26)
            })
        })

        describe('#parse()', function() {

            it('should return Dora as TimeString specified', function() {
                const time_string = '2020-10-08 15:32:01.158'
                const m = Dora.parse(time_string)
                expect(m.year()).toEqual(2020)
                expect(m.month()).toEqual(9)
                expect(m.date()).toEqual(8)
                expect(m.day()).toEqual(4)
                expect(m.hour()).toEqual(15)
                expect(m.minute()).toEqual(32)
                expect(m.second()).toEqual(1)
                expect(m.millisecond()).toEqual(158)
            })

            it('should return Dora as TimeString specified', function() {
                const time_string = '2020-10-08 11:03:16.158+08:00'
                const yangon = Dora.parse(time_string).timezone('Asia/Yangon')
                expect(yangon.hour()).toEqual(9)
                expect(yangon.minute()).toEqual(33)
                const tokyo = Dora.parse(time_string).timezone('Asia/Tokyo')
                expect(tokyo.hour()).toEqual(12)
                expect(tokyo.minute()).toEqual(3)
            })

            it('should throw error if can\'t parse time string', function() {
                expect(() => Dora.parse('20220102123212')).toThrow()
            })
        })

        describe('.format()', function() {
            it('should return time string as specified format', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                const n = new Dora(1652686708000, 'America/Inuvik')
                expect(m.format()).toEqual('2022-05-16T15:38:28.000+08:00')
                expect(m.format('YYYY')).toEqual('2022')
                expect(m.format('YYYY[YYYY]')).toEqual('2022YYYY')
                expect(m.format('YYYY/MM/DD')).toEqual('2022/05/16')
                expect(m.format('YYYY年MM月DD日 HH时mm分ss秒')).toEqual('2022年05月16日 15时38分28秒')
                expect(m.format('YY/M/D d H:m:s')).toEqual('22/5/16 1 15:38:28')
                expect(m.format('YY/MM/D dd h:m:s a ZZ')).toEqual('22/05/16 Mo 3:38:28 pm +0800')
                expect(m.format('YYYY/MMM/DD ddd h:mm:ss A Z')).toEqual('2022/May/16 Mon 3:38:28 PM +08:00')
                expect(m.format('YYYY/MMMM/DD dddd hh:mm:ss A Z')).toEqual('2022/May/16 Monday 03:38:28 PM +08:00')
                expect(new Dora(1652675908000, 'Asia/Shanghai').format('YYYY/MMM/DD ddd h:mm:ss A Z')).toEqual('2022/May/16 Mon 12:38:28 PM +08:00')
                expect(new Dora(1652675908000, 'Asia/Shanghai').format('YYYY/MMMM/DD dddd hh:mm:ss A Z')).toEqual('2022/May/16 Monday 12:38:28 PM +08:00')
                expect(new Dora(1644968075000, 'Asia/Shanghai').format('YYYY/MMM/DD ddd h:mm:ss a Z')).toEqual('2022/Feb/16 Wed 7:34:35 am +08:00')
                expect(new Dora(1644968075000, 'Asia/Shanghai').format('YYYY/MMMM/DD dddd hh:mm:ss A Z')).toEqual('2022/February/16 Wednesday 07:34:35 AM +08:00')
                expect(n.format('YYYY年MM月DD日 HH时mm分ss秒Z')).toEqual('2022年05月16日 01时38分28秒-06:00')
            })
        })

        describe('.toString()', function() {
            it('should return time string as specified format with no parameters.', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                expect(m.format()).toEqual(m.toString())
            })
        })

        describe('.daysInMonth()', function() {
            it('should return total days of current month.', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                expect(m.days_in_month()).toEqual(31)
            })
        })

        describe('.clone()', function() {
            it('should return new Dora as same as current one.', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                const n = m.clone()
                expect(n.valueOf()).toEqual(m.valueOf())
                expect(n.timezone()).toEqual(m.timezone())
            })
        })

        describe('.year()', function() {

            it('should return year of Dora object', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                expect(m.year()).toEqual(2022)
            })

            it('should modify year as given', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                const nm = m.year(2020)
                expect(nm.year()).toEqual(2020)
                expect(m.month()).toEqual(nm.month())
                expect(m.date()).toEqual(nm.date())
            })
        })

        describe('.month()', function() {

            it('should return month of Dora object', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                expect(m.month()).toEqual(4)
            })

            it('should modify month as given', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                const nm = m.month(9)
                expect(m.year()).toEqual(nm.year())
                expect(nm.month()).toEqual(9)
                expect(m.date()).toEqual(nm.date())
            })
        })

        describe('.date()', function() {

            it('should return date of Dora object', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                expect(m.date()).toEqual(16)
            })

            it('should modify date as given', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                const nm = m.date(9)
                expect(m.year()).toEqual(nm.year())
                expect(m.month()).toEqual(nm.month())
                expect(nm.date()).toEqual(9)
            })
        })

        describe('.day()', function() {

            it('should return day of Dora object', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                expect(m.day()).toEqual(1)
            })

            it('should modify day as given', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                const nm = m.day(2)
                expect(nm.day()).toEqual(2)
            })
        })

        describe('.hour()', function() {

            it('should return hour of Dora object', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                expect(m.hour()).toEqual(15)
            })

            it('should modify hour as given', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                const nm = m.hour(9)
                expect(nm.hour()).toEqual(9)
            })
        })

        describe('.minute()', function() {

            it('should return minute of Dora object', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                expect(m.minute()).toEqual(38)
            })

            it('should modify minute as given', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                const nm = m.minute(9)
                expect(nm.minute()).toEqual(9)
            })
        })

        describe('.second()', function() {

            it('should return second of Dora object', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                expect(m.second()).toEqual(28)
            })

            it('should modify second as given', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                const nm = m.second(9)
                expect(nm.second()).toEqual(9)
            })
        })

        describe('.millisecond()', function() {

            it('should return millisecond of Dora object', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                expect(m.millisecond()).toEqual(0)
            })

            it('should modify millisecond as given', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                const nm = m.millisecond(156)
                expect(nm.millisecond()).toEqual(156)
            })
        })

        describe('.add()', function() {

            it('should return Dora of 1 millisecond increased', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                expect(m.format()).toEqual('2022-05-16T15:38:28.000+08:00')
                expect(m.add(1, 'millisecond').format()).toEqual('2022-05-16T15:38:28.001+08:00')
            })

            it('should return Dora of 1 second increased', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                expect(m.format()).toEqual('2022-05-16T15:38:28.000+08:00')
                expect(m.add(1, 'second').format()).toEqual('2022-05-16T15:38:29.000+08:00')
            })

            it('should return Dora of 1 minute increased', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                expect(m.format()).toEqual('2022-05-16T15:38:28.000+08:00')
                expect(m.add(1, 'minute').format()).toEqual('2022-05-16T15:39:28.000+08:00')
            })

            it('should return Dora of 1 hour increased', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                expect(m.format()).toEqual('2022-05-16T15:38:28.000+08:00')
                expect(m.add(1, 'hour').format()).toEqual('2022-05-16T16:38:28.000+08:00')
            })

            it('should return Dora of 1 date increased', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                expect(m.format()).toEqual('2022-05-16T15:38:28.000+08:00')
                expect(m.add(1, 'date').format()).toEqual('2022-05-17T15:38:28.000+08:00')
            })

            it('should return Dora of 1 day increased', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                expect(m.format()).toEqual('2022-05-16T15:38:28.000+08:00')
                expect(m.add(1, 'day').format()).toEqual('2022-05-17T15:38:28.000+08:00')
            })

            it('should return Dora of 1 month increased', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                expect(m.format()).toEqual('2022-05-16T15:38:28.000+08:00')
                expect(m.add(1, 'month').format()).toEqual('2022-06-16T15:38:28.000+08:00')
            })

            it('should return Dora of 1 year increased', function() {
                const m = new Dora(1652686708000, 'Asia/Shanghai')
                expect(m.format()).toEqual('2022-05-16T15:38:28.000+08:00')
                expect(m.add(1, 'year').format()).toEqual('2023-05-16T15:38:28.000+08:00')
            })

            it('should return Dora of 1 second increased that modified higher digit.', function() {
                const m = new Dora(1651334399000, 'Asia/Shanghai')
                const n = m.add(1, 'second')
                expect(m.format()).toEqual('2022-04-30T23:59:59.000+08:00')
                expect(n.format()).toEqual('2022-05-01T00:00:00.000+08:00')
            })
        })

        describe('.get()', function() {

            const m = new Dora(1652686708168, 'Asia/Shanghai')
            // const m = '2022-05-16T15:38:28.000+08:00'

            it('should get value of unit year', function() {
                expect(m.get('year')).toEqual(2022)
            })

            it('should get value of unit month', function() {
                expect(m.get('month')).toEqual(4)
            })

            it('should get value of unit date', function() {
                expect(m.get('date')).toEqual(16)
            })

            it('should get value of unit day', function() {
                expect(m.get('day')).toEqual(1)
            })

            it('should get value of unit hour', function() {
                expect(m.get('hour')).toEqual(15)
            })

            it('should get value of unit minute', function() {
                expect(m.get('minute')).toEqual(38)
            })

            it('should get value of unit second', function() {
                expect(m.get('second')).toEqual(28)
            })

            it('should get value of unit millisecond', function() {
                expect(m.get('millisecond')).toEqual(168)
            })
        })

        describe('.startOf()', function() {

            const m = new Dora(1652686708168, 'Asia/Shanghai')
            // const m = '2022-05-16T15:38:28.000+08:00'

            it('should return given Dora self if specified millisecond.', function() {
                expect(m.start_of('millisecond').format()).toEqual('2022-05-16T15:38:28.168+08:00')
            })

            it('should get start of second of given Dora', function() {
                expect(m.start_of('second').format()).toEqual('2022-05-16T15:38:28.000+08:00')
            })

            it('should get start of minute of given Dora', function() {
                expect(m.start_of('minute').format()).toEqual('2022-05-16T15:38:00.000+08:00')
                expect(Dora.parse('2022-10-08T14:02:25+05:45').timezone('Asia/Kathmandu').start_of('hour').format()).toEqual('2022-10-08T14:00:00.000+05:45')
            })

            it('should get start of hour of given Dora', function() {
                expect(m.start_of('hour').format()).toEqual('2022-05-16T15:00:00.000+08:00')
            })

            it('should get start of date of given Dora', function() {
                expect(m.start_of('date').format()).toEqual('2022-05-16T00:00:00.000+08:00')
            })

            it('should get start of week of given Dora', function() {
                expect(m.start_of('week').format()).toEqual('2022-05-15T00:00:00.000+08:00')
            })

            it('should get start of isoWeek of given Dora', function() {
                expect(m.start_of('isoWeek').format()).toEqual('2022-05-16T00:00:00.000+08:00')
            })

            it('should get start of month of given Dora', function() {
                expect(m.start_of('month').format()).toEqual('2022-05-01T00:00:00.000+08:00')
            })

            it('should get start of year of given Dora', function() {
                expect(m.start_of('year').format()).toEqual('2022-01-01T00:00:00.000+08:00')
            })
        })

        describe('.endOf()', function() {

            const m = new Dora(1652686708168, 'Asia/Shanghai')

            it('should get end of week of given Dora', function() {
                expect(m.end_of('week').format()).toEqual('2022-05-21T23:59:59.999+08:00')
            })

            it('should get end of isoWeek of given Dora', function() {
                expect(m.end_of('isoWeek').format()).toEqual('2022-05-22T23:59:59.999+08:00')
            })
        })
    })
})
