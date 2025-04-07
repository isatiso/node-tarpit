/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ClassProvider, Injector, TpService, ValueProvider } from '@tarpit/core'
import { TpThread } from '../tp-thread'
import { TpThreadStrategy } from '../tp-thread-strategy'

export namespace TestTpThread {

    export class NotAService {
        test_method() {

        }
    }

    @TpService()
    export class TestService {
        constructor() {
        }

        async async_plus(a: number, b: number) {
            return a + b
        }

        plus(a: number, b: number) {
            return a + b
        }

        async throw_error() {
            throw new Error('test error')
        }
    }

    export const injector = Injector.create()
    ClassProvider.create(injector, { provide: TestService, useClass: TestService })
    ValueProvider.create(injector, { provide: TpThreadStrategy, useValue: { worker_entry: __filename, max_threads: 3 } })
    ClassProvider.create(injector, { provide: TpThread, useClass: TpThread })

    export const tp_thread = injector.get(TpThread)?.create()!
}
