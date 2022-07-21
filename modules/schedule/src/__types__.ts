/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ImportsAndProviders } from '@tarpit/core'

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
}

export interface TpScheduleOptions extends ImportsAndProviders {

}
