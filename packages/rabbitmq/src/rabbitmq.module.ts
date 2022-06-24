/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpLoader, TpModule } from '@tarpit/core'

@TpModule({})
export class RabbitmqModule {
    constructor(
        private loader: TpLoader,
    ) {
        // const loader_obj: TpLoaderType = {
        //     on_start: async () => this.schedule.start(),
        //     on_terminate: async () => this.schedule.terminate(),
        //     on_load: (meta: any) => {
        //         if (meta instanceof TpSchedule) {
        //             collect_tasks(meta).forEach(f => this.task_hub.load(f, meta))
        //         }
        //     },
        // }
        // this.loader.register(TpScheduleToken, loader_obj)
    }
}
