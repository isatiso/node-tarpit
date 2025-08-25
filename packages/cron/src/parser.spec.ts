import { describe, it, expect } from 'vitest'
import { generate_sequence, parse_expression, parse_field, parse_range, parse_value, split_to_fields } from './parser'

describe('parser.ts', function() {

    const n_0_59 = [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
        20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
        30, 31, 32, 33, 34, 35, 36, 37, 38, 39,
        40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
        50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
    ]

    const n_0_23 = [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
        10, 11, 12, 13, 14, 15, 16, 17,
        18, 19, 20, 21, 22, 23,
    ]

    describe('#generate_sequence()', function() {

        it('should generate sequence from start to end', function() {
            const res1 = generate_sequence(2, 59, 3, 'minute')
            expect(res1).toEqual([2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35, 38, 41, 44, 47, 50, 53, 56, 59])
            const res2 = generate_sequence(7, 34, 7, 'minute')
            expect(res2).toEqual([7, 14, 21, 28])
        })

        it('should throw error if given second is out of boundary', function() {
            expect(() => generate_sequence(0, 60, 3, 'second')).toThrow('Got range 0-60, expected range is 0-59')
        })

        it('should throw error if given minute is out of boundary', function() {
            expect(() => generate_sequence(0, 60, 3, 'minute')).toThrow('Got range 0-60, expected range is 0-59')
        })

        it('should throw error if given hour is out of boundary', function() {
            expect(() => generate_sequence(0, 24, 3, 'hour')).toThrow('Got range 0-24, expected range is 0-23')
        })

        it('should throw error if given day_of_month is out of boundary', function() {
            expect(() => generate_sequence(0, 32, 3, 'day_of_month')).toThrow('Got range 0-32, expected range is 1-31')
        })

        it('should throw error if given month is out of boundary', function() {
            expect(() => generate_sequence(0, 12, 3, 'month')).toThrow('Got range 0-12, expected range is 1-12')
        })

        it('should throw error if given day_of_week is out of boundary', function() {
            expect(() => generate_sequence(0, 8, 3, 'day_of_week')).toThrow('Got range 0-8, expected range is 0-7')
        })

        it('should throw error if given start is greater than given end', function() {
            expect(() => generate_sequence(10, 5, 3, 'minute')).toThrow('Invalid range: 10-5')
        })
    })

    describe('#parse_range()', function() {

        it('should parse range of second field with step', function() {
            expect(parse_range('0-30/3', 'second')).toEqual([0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30])
        })

        it('should parse range of second field', function() {
            expect(parse_range('3-10', 'second')).toEqual([3, 4, 5, 6, 7, 8, 9, 10])
        })

        it('should parse single second value with step', function() {
            expect(parse_range('3/10', 'second')).toEqual([3, 13, 23, 33, 43, 53])
        })

        it('should parse single second value', function() {
            expect(parse_range('3', 'second')).toEqual([3])
        })

        it('should parse range of minute field with step', function() {
            expect(parse_range('0-30/3', 'minute')).toEqual([0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30])
        })

        it('should parse range of minute field', function() {
            expect(parse_range('3-10', 'minute')).toEqual([3, 4, 5, 6, 7, 8, 9, 10])
        })

        it('should parse single minute value with step', function() {
            expect(parse_range('3/10', 'minute')).toEqual([3, 13, 23, 33, 43, 53])
        })

        it('should parse single minute value', function() {
            expect(parse_range('3', 'minute')).toEqual([3])
        })

        it('should parse range of hour field with step', function() {
            expect(parse_range('0-12/3', 'hour')).toEqual([0, 3, 6, 9, 12])
        })

        it('should parse range of hour field', function() {
            expect(parse_range('3-10', 'hour')).toEqual([3, 4, 5, 6, 7, 8, 9, 10])
        })

        it('should parse single hour value with step', function() {
            expect(parse_range('3/10', 'hour')).toEqual([3, 13, 23])
        })

        it('should parse single hour value', function() {
            expect(parse_range('3', 'hour')).toEqual([3])
        })

        it('should parse range of day_of_month field with step', function() {
            expect(parse_range('1-26/3', 'day_of_month')).toEqual([1, 4, 7, 10, 13, 16, 19, 22, 25])
        })

        it('should parse range of day_of_month field', function() {
            expect(parse_range('3-10', 'day_of_month')).toEqual([3, 4, 5, 6, 7, 8, 9, 10])
        })

        it('should parse single day_of_month value with step', function() {
            expect(parse_range('15/5', 'day_of_month')).toEqual([15, 20, 25, 30])
        })

        it('should parse single day_of_month value', function() {
            expect(parse_range('3', 'day_of_month')).toEqual([3])
        })

        it('should parse range of month field with step', function() {
            expect(parse_range('2-10/3', 'month')).toEqual([2, 5, 8])
        })

        it('should parse range of month field', function() {
            expect(parse_range('5-7', 'month')).toEqual([5, 6, 7])
        })

        it('should parse single month value with step', function() {
            expect(parse_range('3/2', 'month')).toEqual([3, 5, 7, 9, 11])
        })

        it('should parse single month value', function() {
            expect(parse_range('3', 'month')).toEqual([3])
        })

        it('should parse range of day_of_week field with step', function() {
            expect(parse_range('2-6/2', 'day_of_week')).toEqual([2, 4, 6])
        })

        it('should parse range of day_of_week field', function() {
            expect(parse_range('5-7', 'day_of_week')).toEqual([5, 6, 7])
        })

        it('should parse single day_of_week value with step', function() {
            expect(parse_range('3/2', 'day_of_week')).toEqual([3, 5, 7])
        })

        it('should parse single day_of_week value', function() {
            expect(parse_range('3', 'day_of_week')).toEqual([3])
        })

        it('should return undefined if given value is not regular', function() {
            expect(parse_range('12-/3', 'minute')).toBeUndefined()
        })

        it('should throw error if given value is out of boundary', function() {
            expect(() => parse_range('10-24', 'month')).toThrow('Got range 10-24, expected range is 1-12')
            expect(() => parse_range('13', 'month')).toThrow('Got value 13, expected range is 1-12')
        })
    })

    describe('#parse_value()', function() {

        it('should parse common format as parse_range', function() {
            expect(parse_value('3', 'day_of_week')).toEqual(parse_range('3', 'day_of_week'))
            expect(parse_value('3-10', 'month')).toEqual(parse_range('3-10', 'month'))
            expect(parse_value('3-10/2', 'minute')).toEqual(parse_range('3-10/2', 'minute'))
        })

        it('should return parameter value if match special day of month pattern', function() {
            expect(parse_value('lw', 'day_of_month')).toEqual('lw')
            expect(parse_value('12w', 'day_of_month')).toEqual('12w')
            expect(parse_value('l', 'day_of_month')).toEqual('l')
        })

        it('should return parameter value if match special day of week pattern', function() {
            expect(parse_value('5l', 'day_of_week')).toEqual('5l')
            expect(parse_value('4#3', 'day_of_week')).toEqual('4#3')
        })

        it('should convert 7 to 0 in special day of week case', function() {
            expect(parse_value('7l', 'day_of_week')).toEqual('0l')
            expect(parse_value('7#1', 'day_of_week')).toEqual('0#1')
        })

        it('should throw error if not match any pattern', function() {
            expect(() => parse_value('7l7', 'day_of_week')).toThrow('Wrong value 7l7 for type day_of_week')
            expect(() => parse_value('7l7', 'day_of_month')).toThrow('Wrong value 7l7 for type day_of_month')
            expect(() => parse_value('2-', 'month')).toThrow('Wrong value 2- for type month')
        })
    })

    describe('#parse_field()', function() {

        it('should parse field of second', function() {
            const [v1, s1] = parse_field('2-15', 'second')
            expect(Array.from(v1.keys())).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
            expect(s1).toEqual(new Set())
            const [v2, s2] = parse_field('*', 'second')
            expect(Array.from(v2.keys())).toEqual(n_0_59)
            expect(s2).toEqual(new Set())
        })

        it('should parse field of minute', function() {
            const [v1, s1] = parse_field('2-15', 'minute')
            expect(Array.from(v1.keys())).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
            expect(s1).toEqual(new Set())
            const [v2, s2] = parse_field('*', 'minute')
            expect(Array.from(v2.keys())).toEqual(n_0_59)
            expect(s2).toEqual(new Set())
        })

        it('should parse field of hour', function() {
            const [v1, s1] = parse_field('2-15', 'hour')
            expect(Array.from(v1.keys())).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
            expect(s1).toEqual(new Set())
            const [v2, s2] = parse_field('*', 'hour')
            expect(Array.from(v2.keys())).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23])
            expect(s2).toEqual(new Set())
        })

        it('should parse field of day_of_month', function() {
            const [v1, s1] = parse_field('2-15', 'day_of_month')
            expect(Array.from(v1.keys())).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
            expect(s1).toEqual(new Set())
            const [v2, s2] = parse_field('*', 'day_of_month')
            expect(Array.from(v2.keys())).toEqual([
                1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
                17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31
            ])
            expect(s2).toEqual(new Set())
        })

        it('should parse special field of day_of_month', function() {
            const [v1, s1] = parse_field('5w', 'day_of_month')
            expect(Array.from(v1.keys())).toEqual([])
            expect(s1).toEqual(new Set(['5w']))
            const [v2, s2] = parse_field('lw', 'day_of_month')
            expect(Array.from(v2.keys())).toEqual([])
            expect(s2).toEqual(new Set(['lw']))
        })

        it('should parse field of month', function() {
            const [v1, s1] = parse_field('2-8', 'month')
            expect(Array.from(v1.keys())).toEqual([2, 3, 4, 5, 6, 7, 8])
            expect(s1).toEqual(new Set())
            const [v2, s2] = parse_field('*', 'month')
            expect(Array.from(v2.keys())).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
            expect(s2).toEqual(new Set())
        })

        it('should parse alias of month', function() {
            expect(Array.from(parse_field('jan-may', 'month')[0].keys())).toEqual([1, 2, 3, 4, 5])
        })

        it('should parse field of day_of_week', function() {
            const [v1, s1] = parse_field('2-6', 'day_of_week')
            expect(Array.from(v1.keys())).toEqual([2, 3, 4, 5, 6])
            expect(s1).toEqual(new Set())
            const [v2, s2] = parse_field('*', 'day_of_week')
            expect(Array.from(v2.keys())).toEqual([0, 1, 2, 3, 4, 5, 6])
            expect(s2).toEqual(new Set())
            const [v3, s3] = parse_field('5-7', 'day_of_week')
            expect(Array.from(v3.keys()).sort()).toEqual([0, 5, 6].sort())
            expect(s3).toEqual(new Set())
        })

        it('should parse special field of day_of_week', function() {
            const [v1, s1] = parse_field('5#3', 'day_of_week')
            expect(Array.from(v1.keys())).toEqual([])
            expect(s1).toEqual(new Set(['5#3']))
            const [v2, s2] = parse_field('5l', 'day_of_week')
            expect(Array.from(v2.keys())).toEqual([])
            expect(s2).toEqual(new Set(['5l']))
        })

        it('should parse alias of day_of_week', function() {
            expect(Array.from(parse_field('tue-fri', 'day_of_week')[0].keys())).toEqual([2, 3, 4, 5])
        })

        it('should parse combine type of field value', function() {
            const [v1, s1] = parse_field('0,3,5#3', 'day_of_week')
            expect(Array.from(v1.keys())).toEqual([0, 3])
            expect(s1).toEqual(new Set(['5#3']))
            const [v2, s2] = parse_field('1,3-15/3,lw', 'day_of_month')
            expect(Array.from(v2.keys())).toEqual([1, 3, 6, 9, 12, 15])
            expect(s2).toEqual(new Set(['lw']))
        })
    })

    describe('#split_to_fields()', function() {

        it('should split to fields by whitespace characters', function() {
            expect(split_to_fields('a b c d e f')).toEqual(['a', 'b', 'c', 'd', 'e', 'f'])
        })

        it('should throw error if there is more than six fields', function() {
            expect(() => split_to_fields('a b c d e f g')).toThrow('Invalid cron expression a b c d e f g')
        })

        it('should split to fill empty fields with default value', function() {
            expect(split_to_fields('a b c')).toEqual(['0', '*', '*', 'a', 'b', 'c'])
        })
    })

    describe('#parse_expression()', function() {

        it('should convert predefined value to expression', function() {
            expect(parse_expression('@monthly')).toEqual({
                second: [0],
                minute: [0],
                hour: [0],
                day_of_month: [1],
                day_of_month_special: [],
                day_of_month_wildcard: false,
                month: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                day_of_week: [0, 1, 2, 3, 4, 5, 6],
                day_of_week_special: [],
                day_of_week_wildcard: true,
            })
        })

        it('should parse second, minute, hour, day of month, month, day of week', function() {
            expect(parse_expression('0 * * 2/3 */2 *')).toEqual({
                second: [0],
                minute: n_0_59,
                hour: n_0_23,
                day_of_month: [
                    2, 5, 8, 11, 14,
                    17, 20, 23, 26, 29
                ],
                day_of_month_special: [],
                day_of_month_wildcard: false,
                month: [1, 3, 5, 7, 9, 11],
                day_of_week: [
                    0, 1, 2, 3,
                    4, 5, 6
                ],
                day_of_week_special: [],
                day_of_week_wildcard: true,
            })
        })
    })
})
