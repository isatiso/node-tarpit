/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Constructor } from '@tarpit/core'
import { TpScheduleMeta } from './__types__'

declare module '@tarpit/core' {

    export interface TpRootOptions {
        schedules?: Constructor<any>[]
    }

    export interface TpModuleLikeCollector {
        TpSchedule: TpScheduleMeta
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
