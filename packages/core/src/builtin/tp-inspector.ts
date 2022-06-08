/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '../annotations'
import { Injector } from '../injector'

export const STARTED_AT = Symbol('started_at')
export const START_TIME = Symbol('start_time')
export const TERMINATED_AT = Symbol('terminated_at')
export const TERMINATE_TIME = Symbol('terminate_time')

@TpService()
export class TpInspector {

    constructor(
        private injector: Injector
    ) {
    }

    get started_at(): number {
        return this.injector.get<number>(STARTED_AT)?.create() ?? 0
    }

    get start_time(): number {
        return this.injector.get<number>(START_TIME)?.create() ?? 0
    }

    get terminated_at(): number {
        return this.injector.get<number>(TERMINATED_AT)?.create() ?? 0
    }

    get terminate_time(): number {
        return this.injector.get<number>(TERMINATE_TIME)?.create() ?? 0
    }

}
