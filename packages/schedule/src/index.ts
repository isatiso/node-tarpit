/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Constructor } from '@tarpit/core'
import { TpScheduleMeta, TpScheduleUnit } from './__types__'
import { TpTrigger } from './tp-trigger'

declare module '@tarpit/core' {

    export interface TpRootOptions {
        schedules?: Constructor<any>[]
    }

    export interface TpAssemblyCollection {
        TpSchedule: TpScheduleMeta
    }

    export interface TpUnitCollection {
        TpScheduleUnit: TpScheduleUnit<any>,
    }

    export interface TpPluginCollection {
        TpTrigger: typeof TpTrigger
    }
}

export * from './__types__'
export * from './__annotations__'

export * from './__services__/task-life-cycle'
export * from './__services__/task-lock'

export * from './bullet'
export * from './crontab'
export * from './task-context'
export * from './tp-trigger'
