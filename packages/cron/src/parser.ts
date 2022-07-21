/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConstraintError, ParseCronError } from './error'

/**
 * @ref https://en.wikipedia.org/wiki/Cron
 */

export type FieldType = keyof ParsedFields

export interface ParsedFields {
    second: number[]
    minute: number[]
    hour: number[]
    month: number[]
    day_of_month: number[]
    day_of_week: number[]
}

export interface ParsedSpecials {
    day_of_month_special: string[]
    day_of_week_special: string[]
    day_of_month_wildcard: boolean
    day_of_week_wildcard: boolean
}

const FIELD_NAMES: FieldType[] = ['second', 'minute', 'hour', 'day_of_month', 'month', 'day_of_week']

const VALUE_CONSTRAINTS = {
    month: { min: 1, max: 12 },
    day_of_month: { min: 1, max: 31 },
    day_of_week: { min: 0, max: 7 },
    hour: { min: 0, max: 23 },
    minute: { min: 0, max: 59 },
    second: { min: 0, max: 59 },
}

const MONTH_ALIAS: { [prop: string]: number } = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12
}

const WEEK_ALIAS: { [prop: string]: number } = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6
}

const PRE_DEFINED: Record<string, string> = {
    '@yearly': '0 0 0 1 1 *',
    '@monthly': '0 0 0 1 * *',
    '@weekly': '0 0 0 * * 0',
    '@daily': '0 0 0 * * *',
    '@hourly': '0 0 * * * *'
}

const RANGE_REGEX = /^(\d{1,2})(?:-(\d{1,2}))?(?:\/(\d{1,2}))?$/
const DAY_OF_WEEK_SPECIAL_REGEX = /^([0-7]#[1-5]|[0-7]l)$/
const DAY_OF_MONTH_SPECIAL_REGEX = /^(lw?|\d{1,2}w)$/

export function generate_sequence(start: number, end: number, step: number, value_type: FieldType) {
    if (end < start) {
        throw new ParseCronError(`Invalid range: ${start}-${end}`)
    }
    if (start < VALUE_CONSTRAINTS[value_type].min || end > VALUE_CONSTRAINTS[value_type].max) {
        throw new ConstraintError(`Got range ${start}-${end}, expected range is ${VALUE_CONSTRAINTS[value_type].min}-${VALUE_CONSTRAINTS[value_type].max}`)
    }
    const res: number[] = []
    for (let i = start; i <= end; i += step) {
        res.push(i)
    }
    return res
}

export function parse_range(value: string, value_type: FieldType): number[] | undefined {
    const regex_arr = RANGE_REGEX.exec(value)
    if (!regex_arr) {
        return
    }
    if (regex_arr[2] || regex_arr[3]) {
        const start = regex_arr[1]
        const stop = regex_arr[2] ?? VALUE_CONSTRAINTS[value_type].max
        const step = regex_arr[3] ?? 1
        return generate_sequence(+start, +stop, +step, value_type)
    } else {
        const num = +value
        if (num < VALUE_CONSTRAINTS[value_type].min || num > VALUE_CONSTRAINTS[value_type].max) {
            throw new ConstraintError(`Got value ${num}, expected range is ${VALUE_CONSTRAINTS[value_type].min}-${VALUE_CONSTRAINTS[value_type].max}`)
        }
        return [+value]
    }
}

export function parse_value(value: string, value_type: FieldType): number[] | string {
    const seq = parse_range(value, value_type)
    if (seq) {
        return seq
    }
    if (value_type === 'day_of_month') {
        if (DAY_OF_MONTH_SPECIAL_REGEX.test(value)) {
            return value
        }
    } else if (value_type === 'day_of_week') {
        if (DAY_OF_WEEK_SPECIAL_REGEX.test(value)) {
            return value.replace('7', '0')
        }
    }
    throw new ConstraintError(`Wrong value ${value} for type ${value_type}`)
}

export function parse_field(item: string, value_type: FieldType): [list: Set<number>, special: Set<string>] {

    // Get constrains for specified value type.
    const constraints = VALUE_CONSTRAINTS[value_type]

    // Replace all "*" to wildcard range.
    if (item.indexOf('*') !== -1) {
        item = item.replace(/\*/g, constraints.min + '-' + constraints.max)
    }

    // Replace alias to corresponding number.
    if (value_type === 'day_of_week') {
        item = item.replace(/(sun|mon|tue|wed|thu|fri|sat)/g, match => WEEK_ALIAS[match] + '')
    } else if (value_type === 'month') {
        item = item.replace(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/g, match => MONTH_ALIAS[match] + '')
    }

    // Parse each item from list.
    const value_set = new Set<number>()
    const special_set = new Set<string>()
    item.split(',').forEach(value => {
        const res = parse_value(value, value_type)
        if (Array.isArray(res)) {
            res.forEach(v => value_set.add(v))
        } else {
            special_set.add(res)
        }
    })

    // Replace 7 to 0 for consistency of represent of Sunday.
    if (value_type === 'day_of_week' && value_set.has(7)) {
        value_set.add(0)
        value_set.delete(7)
    }

    // Return sorted value list.
    return [value_set, special_set]
}

export function split_to_fields(expression: string) {
    const fields = expression.trim().split(/\s+/)

    if (fields.length > 6) {
        throw new ParseCronError(`Invalid cron expression ${expression}`)
    }

    for (let i = 6 - fields.length - 1; i >= 0; i--) {
        i === 0 ? fields.unshift('0') : fields.unshift('*')
    }
    return fields
}

export function parse_expression(expression: string): ParsedFields & ParsedSpecials {
    expression = expression.toLowerCase()
    if (PRE_DEFINED[expression]) {
        expression = PRE_DEFINED[expression]
    }
    const fields = split_to_fields(expression)
    const res = {} as ParsedFields & ParsedSpecials
    res.day_of_month_wildcard = fields[3] === '*'
    res.day_of_week_wildcard = fields[5] === '*'
    FIELD_NAMES.forEach((name, i) => {
        const value = fields[i]
        const [value_set, special_set] = parse_field(value, name)
        res[name] = Array.from(value_set).sort((a, b) => a - b)
        if (name === 'day_of_month') {
            res.day_of_month_special = Array.from(special_set).sort()
        } else if (name === 'day_of_week') {
            res.day_of_week_special = Array.from(special_set).sort()
        }
    })
    return res
}
