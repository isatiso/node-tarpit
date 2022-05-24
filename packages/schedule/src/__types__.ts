/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ImportsAndProviders, TpAssemblyCommon, TpUnitCommon } from '@tarpit/core'
import { Crontab } from './crontab'

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

export interface TaskOptions {
    utc?: boolean
    tz?: string
    name?: string
}

export interface InnerOptions {
    _is_day_of_month_wildcard_match?: boolean
    _is_day_of_week_wildcard_match?: boolean
}

export interface TpScheduleOptions extends ImportsAndProviders {

}

export interface TpScheduleMeta extends TpAssemblyCommon<'TpSchedule'> {
    type: 'TpSchedule'
    schedule_options?: TpScheduleOptions
}

export interface TpScheduleUnit<T extends (...args: any) => any> extends TpUnitCommon<T> {
    u_type: 'TpScheduleUnit'
    us_crontab_str?: string
    us_crontab?: Crontab
    us_task_options?: TaskOptions
    us_name?: string
    us_lock_key?: string
    us_lock_expires?: number
}
