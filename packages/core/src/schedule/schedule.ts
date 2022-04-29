/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Dora } from '../builtin'
import { FieldType, InnerOptions, ScheduleOptions } from './__type__'
import { parse_field } from './cron/cron-item-parser'
import { CronMonth } from './cron/cron-month'
import { ParsedFields } from './cron/parsed-fields'

/**
 * @category Schedule
 */
export class Schedule {

    static readonly fieldnames: FieldType[] = ['second', 'minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek']
    static readonly default_fields = ['0', '*', '*', '*', '*', '*']
    static readonly predefined: { [prop: string]: string } = {
        '@yearly': '0 0 1 1 *',
        '@monthly': '0 0 1 * *',
        '@weekly': '0 0 * * 0',
        '@daily': '0 0 * * *',
        '@hourly': '0 * * * *'
    }
    private readonly _utc: boolean
    private readonly _tz: string
    private readonly _is_day_of_month_wildcard_match: boolean = false
    private readonly _is_day_of_week_wildcard_match: boolean = false
    private _year: number
    private _month: number
    private _now: Dora
    private _schedule: CronMonth

    constructor(
        private readonly parsed_fields: ParsedFields,
        private readonly options?: ScheduleOptions & InnerOptions,
    ) {
        this._utc = options?.utc ?? false
        this._tz = this._utc ? 'UTC' : options?.tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone
        this._is_day_of_month_wildcard_match = options?._is_day_of_month_wildcard_match ?? false
        this._is_day_of_week_wildcard_match = options?._is_day_of_week_wildcard_match ?? false
        this._now = Dora.now(this._tz)
        this._year = this._now.year()
        this._month = this._now.month() + 1
        if (!this.parsed_fields.month.includes(this._month)) {
            this._change_next_month()
        }
        this._schedule = this._make_schedule()
    }

    static parse(expression: string, options?: ScheduleOptions & InnerOptions) {

        options = options ?? {}
        if (Schedule.predefined[expression]) {
            expression = Schedule.predefined[expression]
        }

        const fields: (string | number)[][] = []
        const raw_fields = expression.trim().split(/\s+/)
        if (raw_fields.length > 6) {
            throw new Error('Invalid cron expression')
        }

        // Mark if character "*" or "?" appears on day of week field.
        if (raw_fields[raw_fields.length - 1] === '*' || raw_fields[raw_fields.length - 1] === '?') {
            options._is_day_of_week_wildcard_match = true
        }

        // Mark if character "*" or "?" appears on day of month field.
        if (raw_fields[raw_fields.length - 3] === '*' || raw_fields[raw_fields.length - 3] === '?' || raw_fields[raw_fields.length - 3] === undefined) {
            options._is_day_of_month_wildcard_match = true
        }

        // Parse fields from "second" to "dayOfWeek".
        const start = Schedule.fieldnames.length - raw_fields.length
        for (let i = 0, c = Schedule.fieldnames.length; i < c; i++) {
            const field = Schedule.fieldnames[i]
            const value = raw_fields[i - start] ?? Schedule.default_fields[i]
            fields.push(parse_field(value, field))
        }

        // Return schedule with parsed fields.
        return new Schedule(new ParsedFields(fields), options)
    }

    next() {
        while (true) {
            const res = this._schedule.next()
            if (!res) {
                this._now = this._now.add(1, 'month').startOf('month')
                this._change_next_month()
                this._schedule = this._make_schedule()
            } else {
                this._now = res
                return res
            }
        }
    }

    private _change_next_month() {
        for (const m of this.parsed_fields.month) {
            if (m > this._month) {
                this._month = m as number
                this._now = this._now.set('month', this._month - 1)
                return
            }
        }
        this._month = this.parsed_fields.month[0] as number
        this._year++
        this._now = this._now.add(1, 'year').startOf('year').set('month', this._month - 1)
    }

    private _deal_special_day_of_month(schedule: Set<number>, date: Dora) {
        const days_in_month = date.daysInMonth()
        this.parsed_fields.dayOfMonth.forEach(ele => {
            if (typeof ele === 'number') {
                if (ele >= 1 && ele <= days_in_month) {
                    schedule.add(ele)
                }
            } else if (ele === 'l') {
                schedule.add(days_in_month)
            } else if (/^[1-9]w|[0-3][0-9]w|lw|wl$/.test(ele)) {
                let w_date = ele.indexOf('l') !== -1 ? days_in_month : +ele.replace('w', '')
                if (w_date > days_in_month) {
                    w_date = days_in_month
                }
                const target = date.set('date', w_date)
                if (target.date() === 1 && target.day() === 6) {
                    schedule.add(3)
                } else if (target.date() === days_in_month && target.day() === 0) {
                    schedule.add(days_in_month - 2)
                } else if (target.day() === 6) {
                    schedule.add(w_date - 1)
                } else if (target.day() === 0) {
                    schedule.add(w_date + 1)
                } else {
                    schedule.add(w_date)
                }
            }
        })
    }

    private _deal_special_day_of_week(schedule: Set<number>, date: Dora) {
        const days_in_month = date.daysInMonth()
        const date_matrix: number[][] = [[], [], [], [], [], [], []]
        for (let d = 1, wd = date.get('day'); d <= days_in_month; d++) {
            date_matrix[wd].push(d)
            wd++
            if (wd === 7) {
                wd = 0
            }
        }
        this.parsed_fields.dayOfWeek.forEach(ele => {
            if (typeof ele === 'number') {
                if (0 <= ele && ele <= 6) {
                    date_matrix[ele].forEach(d => schedule.add(d))
                }
            } else if (ele.indexOf('#') !== -1) {
                const [w, c] = ele.split('#')
                const d = date_matrix[+w]?.[+c - 1]
                if (d) {
                    schedule.add(d)
                }
            } else if (ele.indexOf('l') !== -1) {
                const w = +ele.replace('l', '')
                const wds = date_matrix[+w]
                if (wds) {
                    schedule.add(wds[wds.length - 1])
                }
            }
        })
    }

    private _make_schedule(): CronMonth {
        const schedule = new Set<number>()
        if (!this._is_day_of_month_wildcard_match || this._is_day_of_week_wildcard_match) {
            this._deal_special_day_of_month(schedule, Dora.from([this._year, this._month - 1], this._tz))
        }
        if (!this._is_day_of_week_wildcard_match) {
            this._deal_special_day_of_week(schedule, Dora.from([this._year, this._month - 1], this._tz))
        }
        return new CronMonth(this._year, this._month - 1, this._now, this._tz, [
            Array.from<number>(schedule).sort((a, b) => a - b),
            Array.from<number>(this.parsed_fields.hour as number[]),
            Array.from<number>(this.parsed_fields.minute as number[]),
            Array.from<number>(this.parsed_fields.second as number[]),
        ])
    }
}
