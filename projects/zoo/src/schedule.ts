/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Inject, Optional, TpRoot, TpService } from '@tarpit/core'
import { ScheduleModule, Task, TaskContext, TpSchedule } from '@tarpit/schedule'

@TpService()
class TestService {
    constructor(
        @Optional()
        @Inject('œœ-TpStartedAtaefaef')
        private aaa: number,
    ) {
    }
}

@TpSchedule({
    providers: [TestService]
})
class TestTrigger {

    constructor(
        private ts: TestService
    ) {
    }

    @Task('*/5 * * * * *', '测试任务')
    async test(context: TaskContext) {
        console.log('test', context.count, context.retry_limit, new Date().toISOString())
        // return await new Promise((resolve, reject) => {
        //
        //     if (context.count > 3) {
        //         reject(new TaskCrash('Jesus', 'Jesus Christ'))
        //     } else {
        //         setTimeout(() => reject(new TaskRetry(5)), 200)
        //     }
        // })
    }
}

@TpRoot({
    imports: [
        ScheduleModule,
    ],
    entries: [
        TestTrigger
    ],
})
export class TriggerRoot {
}
