/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpLoader, TpModule } from '@tarpit/core'
import { TpScheduleToken } from './annotations'
import { ScheduleHooks } from './services/schedule-hooks'
import { ScheduleHub } from './services/schedule-hub'
import { ScheduleInspector } from './services/schedule-inspector'
import { ScheduleTick } from './services/schedule-tick'
import { collect_tasks } from './tools/collect-tasks'

@TpModule({
    providers: [
        ScheduleHooks,
        ScheduleHub,
        ScheduleInspector,
        ScheduleTick,
    ]
})
export class ScheduleModule {

    constructor(
        private loader: TpLoader,
        private hub: ScheduleHub,
        private tick: ScheduleTick,
    ) {
        this.loader.register(TpScheduleToken, {
            on_start: async () => this.tick.start(),
            on_terminate: async () => this.tick.terminate(),
            on_load: (meta: any) => collect_tasks(meta).forEach(f => this.hub.load(f, meta)),
        })
    }
}
