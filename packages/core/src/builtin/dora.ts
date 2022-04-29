/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const REGEX_FORMAT = /\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g
export const WEEKDAY_NAME = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_')
export const MONTH_NAME = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_')
export type DateTimeUnit = 'year' | 'month' | 'date' | 'day' | 'hour' | 'minute' | 'second' | 'millisecond'

function formatUTCOffset(dora: Dora, format: 'Z' | 'ZZ') {
    const negMinutes = dora.utcOffset()
    const minutes = Math.abs(negMinutes)
    const hourOffset = Math.floor(minutes / 60)
    const minuteOffset = minutes % 60
    return `${negMinutes <= 0 ? '+' : '-'}${String(hourOffset).padStart(2, '0')}${format === 'Z' ? ':' : ''}${String(minuteOffset).padStart(2, '0')}`
}

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
        dd: dora => MONTH_NAME[dora.$W].substring(0, 2),
        ddd: dora => MONTH_NAME[dora.$W].substring(0, 3),
        dddd: dora => MONTH_NAME[dora.$W],
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
    public $y!: number
    public $M!: number
    public $D!: number
    public $W!: number
    public $H!: number
    public $m!: number
    public $s!: number
    public $ms!: number
    public readonly $utcOffset!: number
    private readonly $z!: string

    constructor(ts: number, timezone?: string) {
        this.$z = timezone ?? Dora.guess_timezone()
        this.$d = new Date(ts)
        new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            fractionalSecondDigits: 3,
            hourCycle: 'h23',
            timeZone: this.$z,
            timeZoneName: 'short'
        } as any).formatToParts(this.$d).forEach(item => {
            switch (item.type) {
                case 'year':
                    this.$y = +item.value
                    break
                case 'month':
                    this.$M = +item.value - 1
                    break
                case 'day':
                    this.$D = +item.value
                    break
                case 'weekday':
                    this.$W = Math.floor(WEEKDAY_NAME.indexOf(item.value))
                    break
                case 'hour':
                    this.$H = +item.value
                    break
                case 'minute':
                    this.$m = +item.value
                    break
                case 'second':
                    this.$s = +item.value
                    break
                case 'fractionalSecond' as any:
                    this.$ms = +item.value
                    break
            }
        })
        this.$utcOffset = (this.$d.getUTCFullYear() - this.$y || this.$d.getUTCMonth() - this.$M || this.$d.getUTCDate() - this.$D) * 24 * 60
            + (this.$d.getUTCHours() - this.$H) * 60
            + this.$d.getUTCMinutes() - this.$m
    }

    static guess_timezone() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone
    }

    static now(timezone?: string) {
        return new Dora(Date.now(), timezone)
    }

    static from(date_arr: [year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, milliseconds?: number], timezone?: string) {
        return new Dora(Date.UTC(...date_arr), timezone).dial_utc_offset()
    }

    static parse(date_str: string, options?: {
        format?: string
        timezone?: string
    }) {
        const ts = Date.parse(date_str)
        if (isNaN(ts)) {
            throw new Error()
        }
        return new Dora(ts, options?.timezone)
    }

    format(format: string = `YYYY-MM-DDTHH:mm:ss.SSSZ`) {
        return format.replace(REGEX_FORMAT, (match, $1) => $1 ?? Dora.DATE_TIME_FORMAT_MATCHES[match](this))
    }

    startOf(unit: Exclude<DateTimeUnit, 'millisecond'> | 'week' | 'isoWeek'): Dora {
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
        }
    }

    endOf(unit: Exclude<DateTimeUnit, 'millisecond'> | 'week' | 'isoWeek'): Dora {
        if (unit === 'week' || unit === 'isoWeek') {
            return this.add(7, 'day').startOf(unit).subtract(1, 'millisecond')
        } else {
            return this.add(1, unit).startOf(unit).subtract(1, 'millisecond')
        }
    }

    add(int: number, unit: DateTimeUnit): Dora {
        switch (unit) {
            case 'year':{
                const date = this.date()
                const nd = new Date(this.date(5).valueOf())
                return new Dora(nd.setUTCFullYear(nd.getUTCFullYear() + int), this.$z).date(date)
            }
            case 'month':{
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

    subtract(int: number, unit: DateTimeUnit): Dora {
        return this.add(-int, unit)
    }

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
        return this
    }

    year(): number
    year(int: number): Dora
    year(int?: number): Dora | number {
        if (typeof int === 'number') {
            return this.set('year', int)
        } else {
            return this.$y
        }
    }

    month(): number
    month(int: number): Dora
    month(int?: number): Dora | number {
        if (typeof int === 'number') {
            return this.set('month', int)
        } else {
            return this.$M
        }
    }

    date(): number
    date(int: number): Dora
    date(int?: number): Dora | number {
        if (typeof int === 'number') {
            return this.set('date', int)
        } else {
            return this.$D
        }
    }

    day(): number
    day(int: number): Dora
    day(int?: number): Dora | number {
        if (typeof int === 'number') {
            return this.set('day', int)
        } else {
            return this.$W
        }
    }

    hour(): number
    hour(int: number): Dora
    hour(int?: number): Dora | number {
        if (typeof int === 'number') {
            return this.set('hour', int)
        } else {
            return this.$H
        }
    }

    minute(): number
    minute(int: number): Dora
    minute(int?: number): Dora | number {
        if (typeof int === 'number') {
            return this.set('minute', int)
        } else {
            return this.$m
        }
    }

    second(): number
    second(int: number): Dora
    second(int?: number): Dora | number {
        if (typeof int === 'number') {
            return this.set('second', int)
        } else {
            return this.$s
        }
    }

    millisecond(): number
    millisecond(int: number): Dora
    millisecond(int?: number): Dora | number {
        if (typeof int === 'number') {
            return this.set('millisecond', int)
        } else {
            return this.$ms
        }
    }

    daysInMonth() {
        return this.endOf('month').$D
    }

    utcOffset() {
        return this.$utcOffset
    }

    toString() {
        return this.format()
    }

    valueOf() {
        return this.$d.getTime()
    }

    clone() {
        return new Dora(this.$d.getTime(), this.$z)
    }

    private dial_utc_offset(): Dora {
        return this.add(this.$utcOffset, 'minute')
    }
}

