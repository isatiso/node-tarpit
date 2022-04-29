/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export type FieldType = 'second' | 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek'

/**
 * 任务描述对象
 */
export interface TaskDesc {
    /**
     * 任务 ID
     */
    id: string
    /**
     * 任务名称
     */
    name: string
    /**
     * 任务位置，格式为 类名.方法名
     */
    pos: string
    /**
     * 任务的 crontab 描述
     */
    crontab: string
    /**
     * 任务的计划下次执行时间戳。
     */
    next_exec_ts: number
    /**
     * 任务的计划下次执行时间戳的日期格式。
     */
    next_exec_date_string: string
}

export interface ScheduleOptions {
    utc?: boolean
    tz?: string
    name?: string
}

export interface InnerOptions {
    _is_day_of_month_wildcard_match?: boolean
    _is_day_of_week_wildcard_match?: boolean
}
