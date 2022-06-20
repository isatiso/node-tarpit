/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Injector, TpLoader, TpLoaderType, TpModule } from '@tarpit/core'
import { TpSchedule, TpScheduleToken } from './annotations'
import { AbstractTriggerHooks, Clerk, Schedule, ScheduleInspector, TaskHub, TpTriggerHooks } from './services'
import { collect_tasks } from './tools'

@TpModule({
    providers: [
        Clerk,
        Schedule,
        ScheduleInspector,
        TaskHub,
        { provide: AbstractTriggerHooks, useClass: TpTriggerHooks },
    ]
})
export class ScheduleModule {

    constructor(
        private injector: Injector,
        private task_hub: TaskHub,
        private schedule: Schedule,
    ) {
        const loader_obj: TpLoaderType = {
            on_start: async () => this.schedule.start(),
            on_terminate: async () => this.schedule.terminate(),
            on_load: (meta: any) => {
                if (meta instanceof TpSchedule) {
                    collect_tasks(meta).forEach(f => this.task_hub.load(f, meta))
                }
            },
        }
        this.injector.get(TpLoader)?.create().register(TpScheduleToken, loader_obj)
    }
}
