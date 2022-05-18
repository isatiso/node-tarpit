/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */
import { parse_date_field } from './date-tools'

export const REGEX_FORMAT = /\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g
export const WEEKDAY_NAME = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_')
export const MONTH_NAME = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_')
export type DateTimeUnit = 'year' | 'month' | 'date' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond'
export type DateTimeArray = [year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, milliseconds?: number]

// noinspection SpellCheckingInspection
const DEFAULT_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZ'

function formatUTCOffset(dora: Dora, format: 'Z' | 'ZZ') {
    const negMinutes = dora.utcOffset()
    const minutes = Math.abs(negMinutes)
    const hourOffset = Math.floor(minutes / 60)
    const minuteOffset = minutes % 60
    return `${negMinutes <= 0 ? '+' : '-'}${String(hourOffset).padStart(2, '0')}${format === 'Z' ? ':' : ''}${String(minuteOffset).padStart(2, '0')}`
}

/**
 * 日期时间封装，不可变对象，所有修改方法都会返回一个新的 Dora 对象。
 */
export class Dora {

    static DATE_TIME_FORMAT_MATCHES: Record<string, (dora: Dora) => string> = {
        YY: dora => String(dora.$y).slice(-2),
        YYYY: dora => String(dora.$y),
        M: dora => String(dora.$M + 1),
        MM: dora => String(dora.$M + 1).padStart(2, '0'),
        MMM: dora => MONTH_NAME[dora.$M].substring(0, 3),
        MMMM: dora => MONTH_NAME[dora.$M],
        D: dora => String(dora.$D),
        DD: dora => String(dora.$D).padStart(2, '0'),
        d: dora => String(dora.$W),
        dd: dora => WEEKDAY_NAME[dora.$W].substring(0, 2),
        ddd: dora => WEEKDAY_NAME[dora.$W].substring(0, 3),
        dddd: dora => WEEKDAY_NAME[dora.$W],
        H: dora => String(dora.$H),
        HH: dora => String(dora.$H).padStart(2, '0'),
        h: dora => String(dora.$H % 12 || 12),
        hh: dora => String(dora.$H % 12 || 12).padStart(2, '0'),
        a: dora => dora.$H < 12 ? 'am' : 'pm',
        A: dora => dora.$H < 12 ? 'AM' : 'PM',
        m: dora => String(dora.$m),
        mm: dora => String(dora.$m).padStart(2, '0'),
        s: dora => String(dora.$s),
        ss: dora => String(dora.$s).padStart(2, '0'),
        SSS: dora => String(dora.$ms).padStart(3, '0'),
        Z: dora => formatUTCOffset(dora, 'Z'),
        ZZ: dora => formatUTCOffset(dora, 'ZZ'),
    }

    public readonly $d: Date
    public $y: number
    public $M: number
    public $D: number
    public $W: number
    public $H: number
    public $m: number
    public $s: number
    public $ms: number
    public readonly $utcOffset: number
    private readonly $z: string

    constructor(ts: number, timezone?: string) {
        this.$z = timezone ?? Dora.guess_timezone()
        this.$d = new Date(ts)
        const fields = parse_date_field(this.$d, this.$z)
        this.$y = fields.year
        this.$M = fields.month
        this.$D = fields.date
        this.$W = fields.weekday
        this.$H = fields.hour
        this.$m = fields.minute
        this.$s = fields.second
        this.$ms = fields.millisecond
        this.$utcOffset = (this.$d.getUTCFullYear() - this.$y || this.$d.getUTCMonth() - this.$M || this.$d.getUTCDate() - this.$D) * 24 * 60
            + (this.$d.getUTCHours() - this.$H) * 60
            + this.$d.getUTCMinutes() - this.$m
    }

    /**
     * 通过 Intl.DateTimeFormat 获取当前时区。
     */
    static guess_timezone() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone
    }

    /**
     * 提取当前时间的 Dora 对象
     *
     * @param timezone 指定时区
     */
    static now(timezone?: string) {
        return new Dora(Date.now(), timezone)
    }

    /**
     * 从日期时间数组生成 Dora 对象
     *
     * @param date_arr 日期时间数组
     * @param timezone 时区
     */
    static from(date_arr: DateTimeArray, timezone?: string) {
        return new Dora(Date.UTC(...date_arr), timezone).dial_utc_offset()
    }

    /**
     * 通过 Date.parse 解析 date string
     * 默认使用通过 guess_timezone 获取的时区，如果需要指定时区，可以通过调用 .timezone() 进行修改。
     *
     * @param date_str
     */
    static parse(date_str: string) {
        const ts = Date.parse(date_str)
        if (isNaN(ts)) {
            throw new Error()
        }
        return new Dora(ts)
    }

    /**
     * 输出指定格式的 date string
     *
     * 下面是可用的格式：
     * ```
     * YY: 年的后两位，如 1987 => '87', 2020 => '20'
     * YYYY: 完整年，如 1987 => '1987', 2020 => '2020'
     * M: 月对应的数字，如 一月 => '1', 十月 => '10'
     * MM: 月对应的数字，带前置 0，如 一月 => '01', 十月 => '10'
     * MMM: 月对应的名称保留前三位，如 一月 => 'Jan', 十月 => 'Oct'
     * MMMM: 月对应的完整名称，如 一月 => 'January', 十月 => 'October'
     * D: 日期，如 23号 => '23', 1号 => '1'
     * DD: 日期带前置 0，如 23号 => '23', 1号 => '01'
     * d: 一周中的第几天，如 周一 => '1', 周日 => '7'
     * dd: 一周中的第几天对应的名称，保留前两位，如 周一 => 'Mo', 周日 => 'Su'
     * ddd: 一周中的第几天对应的名称，保留前三位，如 周一 => 'Mon', 周日 => 'Sun'
     * dddd: 一周中的第几天对应的完整名称，如 周一 => 'Mon', 周日 => 'Sun'
     * H: 24小时制，如 凌晨1点 => '1', 下午6点 => '18'
     * HH: 24小时制带前置 0，如 凌晨1点 => '01', 下午6点 => '18'
     * h: 12小时制，如 凌晨1点 => '1', 下午6点 => '6'
     * hh: 12小时制前置 0，如 凌晨1点 => '01', 中午12点 => '12', 下午6点 => '06'
     * a: 小写 am pm
     * A: 大写 am pm
     * m: 分钟数
     * mm: 分钟数带前置 0
     * s: 秒数
     * ss: 秒数带前置 0
     * SSS: 毫秒数带前置 0
     * Z: 时区，+08:00
     * ZZ: 时区，+0800
     * ```
     * @param format 指定具体格式，默认格式为 'YYYY-MM-DDTHH:mm:ss.SSSZ'
     */
    format(format: string = DEFAULT_FORMAT) {
        return format.replace(REGEX_FORMAT, (match, $1) => $1 ?? Dora.DATE_TIME_FORMAT_MATCHES[match](this))
    }

    /**
     * 按照时间单位提取起始毫秒对应的 Dora
     *
     * @param unit
     */
    startOf(unit: DateTimeUnit | 'week' | 'isoWeek'): Dora {
        switch (unit) {
            case 'year': {
                const d = new Date(this.$d)
                d.setUTCFullYear(this.$y, 0, 1)
                d.setUTCHours(0, 0, 0, 0)
                return new Dora(d.setUTCMinutes(this.$utcOffset), this.$z)
            }
            case 'month': {
                const d = new Date(this.$d)
                d.setUTCMonth(this.$M, 1)
                d.setUTCHours(0, 0, 0, 0)
                return new Dora(d.setUTCMinutes(this.$utcOffset), this.$z)
            }
            case 'isoWeek': {
                return this.subtract((this.$W + 6) % 7, 'day').startOf('day')
            }
            case 'week': {
                return this.subtract(this.$W, 'day').startOf('day')
            }
            case 'day': {
                return this.subtract(this.$H, 'hour').startOf('hour')
            }
            case 'date': {
                return this.subtract(this.$H, 'hour').startOf('hour')
            }
            case 'hour': {
                return this.subtract(this.$m, 'minute').startOf('minute')
            }
            case 'minute': {
                return new Dora(new Date(this.$d).setUTCSeconds(0, 0), this.$z)
            }
            case 'second': {
                return new Dora(new Date(this.$d).setUTCMilliseconds(0), this.$z)
            }
            default:
                return this
        }
    }

    /**
     * 返回指定时间单位的最后一毫秒对应的 Dora
     *
     * @param unit
     */
    endOf(unit: Exclude<DateTimeUnit, 'millisecond'> | 'week' | 'isoWeek'): Dora {
        if (unit === 'week' || unit === 'isoWeek') {
            return this.add(7, 'day').startOf(unit).subtract(1, 'millisecond')
        } else {
            return this.add(1, unit).startOf(unit).subtract(1, 'millisecond')
        }
    }

    /**
     * 返回增加指定时间后的 Dora
     *
     * @param int
     * @param unit
     */
    add(int: number, unit: DateTimeUnit): Dora {
        switch (unit) {
            case 'year': {
                const date = this.date()
                const nd = new Date(this.date(5).valueOf())
                return new Dora(nd.setUTCFullYear(nd.getUTCFullYear() + int), this.$z).date(date)
            }
            case 'month': {
                const date = this.date()
                const nd = new Date(this.date(5).valueOf())
                return new Dora(nd.setUTCMonth(nd.getUTCMonth() + int), this.$z).date(date)
            }
            case 'day':
                return new Dora(new Date(this.$d).setUTCDate(this.$d.getUTCDate() + int), this.$z)
            case 'date':
                return new Dora(new Date(this.$d).setUTCDate(this.$d.getUTCDate() + int), this.$z)
            case 'hour':
                return new Dora(new Date(this.$d).setUTCHours(this.$d.getUTCHours() + int), this.$z)
            case 'minute':
                return new Dora(new Date(this.$d).setUTCMinutes(this.$d.getUTCMinutes() + int), this.$z)
            case 'second':
                return new Dora(new Date(this.$d).setUTCSeconds(this.$d.getUTCSeconds() + int), this.$z)
            case 'millisecond':
                return new Dora(new Date(this.$d).setUTCMilliseconds(this.$d.getUTCMilliseconds() + int), this.$z)
        }
    }

    /**
     * 返回减少指定时间段后的 Dora
     *
     * @param int
     * @param unit
     */
    subtract(int: number, unit: DateTimeUnit): Dora {
        return this.add(-int, unit)
    }

    /**
     * 获取指定时间单位上的值
     *
     * @param unit
     */
    get(unit: DateTimeUnit) {
        switch (unit) {
            case 'year':
                return this.$y
            case 'month':
                return this.$M
            case 'day':
                return this.$W
            case 'date':
                return this.$D
            case 'hour':
                return this.$H
            case 'minute':
                return this.$m
            case 'second':
                return this.$s
            case 'millisecond':
                return this.$ms
        }
    }

    /**
     * 设置指定时间单位上的值
     *
     * @param unit
     * @param int
     */
    set(unit: DateTimeUnit, int: number): Dora {
        switch (unit) {
            case 'year':
                return this.add(int - this.$y, 'year')
            case 'month':
                return this.add(int - this.$M, 'month')
            case 'day':
                return this.add(int - this.$W, 'day')
            case 'date':
                return this.add(int - this.$D, 'date')
            case 'hour':
                return this.add(int - this.$H, 'hour')
            case 'minute':
                return this.add(int - this.$m, 'minute')
            case 'second':
                return this.add(int - this.$s, 'second')
            case 'millisecond':
                return this.add(int - this.$ms, 'millisecond')
        }
    }

    /**
     * 获取年的值，相当于 #get('year')
     */
    year(): number
    /**
     * 设置年的值，相当于 #set(int, 'year')
     * @param int
     */
    year(int: number): Dora
    year(int?: number): Dora | number {
        if (typeof int === 'number') {
            return this.set('year', int)
        } else {
            return this.$y
        }
    }

    /**
     * 获取月的值，相当于 #get('month')
     */
    month(): number
    /**
     * 设置月的值，相当于 #set(int, 'month')
     * @param int
     */
    month(int: number): Dora
    month(int?: number): Dora | number {
        if (typeof int === 'number') {
            return this.set('month', int)
        } else {
            return this.$M
        }
    }

    /**
     * 获取日期的值，相当于 #get('date')
     */
    date(): number
    /**
     * 设置日期的值，相当于 #set(int, 'date')
     * @param int
     */
    date(int: number): Dora
    date(int?: number): Dora | number {
        if (typeof int === 'number') {
            return this.set('date', int)
        } else {
            return this.$D
        }
    }

    /**
     * 获取 weekday 的值，相当于 #get('day')
     */
    day(): number
    /**
     * 设置 weekday 的值，相当于 #set(int, 'day')
     * @param int
     */
    day(int: number): Dora
    day(int?: number): Dora | number {
        if (typeof int === 'number') {
            return this.set('day', int)
        } else {
            return this.$W
        }
    }

    /**
     * 获取 hour 的值，相当于 #get('hour')
     */
    hour(): number
    /**
     * 设置 hour 的值，相当于 #set(int, 'hour')
     * @param int
     */
    hour(int: number): Dora
    hour(int?: number): Dora | number {
        if (typeof int === 'number') {
            return this.set('hour', int)
        } else {
            return this.$H
        }
    }

    /**
     * 获取 minute 的值，相当于 #get('minute')
     */
    minute(): number
    /**
     * 设置 minute 的值，相当于 #set(int, 'minute')
     * @param int
     */
    minute(int: number): Dora
    minute(int?: number): Dora | number {
        if (typeof int === 'number') {
            return this.set('minute', int)
        } else {
            return this.$m
        }
    }

    /**
     * 获取 second 的值，相当于 #get('second')
     */
    second(): number
    /**
     * 设置 second 的值，相当于 #set(int, 'second')
     * @param int
     */
    second(int: number): Dora
    second(int?: number): Dora | number {
        if (typeof int === 'number') {
            return this.set('second', int)
        } else {
            return this.$s
        }
    }

    /**
     * 获取 millisecond 的值，相当于 #get('millisecond')
     */
    millisecond(): number
    /**
     * 设置 millisecond 的值，相当于 #set(int, 'millisecond')
     * @param int
     */
    millisecond(int: number): Dora
    millisecond(int?: number): Dora | number {
        if (typeof int === 'number') {
            return this.set('millisecond', int)
        } else {
            return this.$ms
        }
    }

    /**
     * 获取时区的值
     */
    timezone(): string
    /**
     * 设置时区的值
     * @param str
     */
    timezone(str: string): Dora
    timezone(str?: string): Dora | string {
        if (typeof str === 'string') {
            return new Dora(this.$d.getTime(), str)
        } else {
            return this.$z
        }
    }

    /**
     * 获取当前月总共多少天
     */
    daysInMonth() {
        return this.endOf('month').$D
    }

    /**
     * 获取当前时区距离 UTC 时间偏移的分钟数
     */
    utcOffset() {
        return this.$utcOffset
    }

    /**
     * 格式化当前 Dora 对象，相当于 format()
     */
    toString() {
        return this.format()
    }

    /**
     * 获取当前 Dora 对象对应的毫秒时间戳
     */
    valueOf() {
        return this.$d.getTime()
    }

    /**
     * 复制当前 Dora 对象
     */
    clone() {
        return new Dora(this.$d.getTime(), this.$z)
    }

    private dial_utc_offset(): Dora {
        return this.add(this.$utcOffset, 'minute')
    }
}

