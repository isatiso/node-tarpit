/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Dora } from '@tarpit/dora'
import { MonthlySchedule, Schedule } from './monthly-schedule'
import { parse_expression, ParsedFields, ParsedSpecials } from './parser'

export interface ParseCronOptions {
    utc?: boolean
    tz?: string
}

export class Cron {

    private readonly _utc: boolean
    private readonly _tz: string
    private _year: number
    private _month: number
    private _now: Dora
    private _schedule: Schedule

    private constructor(
        private parsed: ParsedFields & ParsedSpecials,
        private options?: ParseCronOptions,
    ) {
        this._utc = options?.utc ?? false
        this._tz = this._utc ? 'UTC' : options?.tz ?? Dora.guess_timezone()
        this._now = Dora.now(this._tz)
        this._year = this._now.year()
        this._month = this._now.month() + 1
        if (!parsed.month.includes(this._month)) {
            this._month_forward()
        }
        this._schedule = this._make_schedule()
    }

    static parse(expression: string, options?: ParseCronOptions) {
        return new Cron(parse_expression(expression), options)
    }

    next() {
        while (true) {
            const res = this._schedule.next()
            if (!res) {
                this._now = this._now.add(1, 'month').start_of('month')
                this._month_forward()
                this._schedule = this._make_schedule()
            } else {
                this._now = res
                return res
            }
        }
    }

    private _month_forward() {
        for (const m of this.parsed.month) {
            if (m > this._month) {
                this._month = m as number
                this._now = this._now.set('month', this._month - 1)
                return
            }
        }
        this._month = this.parsed.month[0] as number
        this._year++
        this._now = this._now.add(1, 'year').start_of('year').set('month', this._month - 1)
    }

    private _deal_special_day_of_month(days: Set<number>, date: Dora) {
        const days_in_month = date.days_in_month()
        this.parsed.day_of_month.forEach(el => el <= days_in_month && days.add(el))
        this.parsed.day_of_month_special.forEach(el => {
            if (el === 'l') {
                days.add(days_in_month)
            } else {
                let w_date = el.indexOf('l') !== -1 ? days_in_month : +el.substring(0, el.length - 1)
                if (w_date > days_in_month) {
                    w_date = days_in_month
                }
                const target = date.set('date', w_date)
                if (target.date() === 1 && target.day() === 6) {
                    days.add(3)
                } else if (target.date() === days_in_month && target.day() === 0) {
                    days.add(days_in_month - 2)
                } else if (target.day() === 6) {
                    days.add(w_date - 1)
                } else if (target.day() === 0) {
                    days.add(w_date + 1)
                } else {
                    days.add(w_date)
                }
            }
        })
    }

    private _deal_special_day_of_week(days: Set<number>, date: Dora) {
        const days_in_month = date.days_in_month()
        const date_matrix: number[][] = [[], [], [], [], [], [], []]
        for (let d = 1, wd = date.get('day'); d <= days_in_month; d++) {
            date_matrix[wd].push(d)
            wd++
            if (wd === 7) {
                wd = 0
            }
        }
        this.parsed.day_of_week.forEach(ele => date_matrix[ele].forEach(d => days.add(d)))
        this.parsed.day_of_week_special.forEach(ele => {
            let cur: number
            // istanbul ignore else
            if ((cur = ele.indexOf('#')) !== -1) {
                const d = date_matrix[+ele.substring(0, cur)][+ele.substring(cur + 1) - 1]
                if (d) {
                    days.add(d)
                }
            } else if ((cur = ele.indexOf('l')) !== -1) {
                const wds = date_matrix[+ele.substring(0, cur)]
                if (wds) {
                    days.add(wds[wds.length - 1])
                }
            }
        })
    }

    private _make_schedule(): MonthlySchedule {
        const days = new Set<number>()
        if (!this.parsed.day_of_month_wildcard || this.parsed.day_of_week_wildcard) {
            this._deal_special_day_of_month(days, Dora.from([this._year, this._month - 1], this._tz))
        }
        if (!this.parsed.day_of_week_wildcard) {
            this._deal_special_day_of_week(days, Dora.from([this._year, this._month - 1], this._tz))
        }
        return new MonthlySchedule(this._year, this._month - 1, this._now, this._tz, [
            Array.from(days).sort((a, b) => a - b),
            Array.from(this.parsed.hour),
            Array.from(this.parsed.minute),
            Array.from(this.parsed.second),
        ])
    }
}
