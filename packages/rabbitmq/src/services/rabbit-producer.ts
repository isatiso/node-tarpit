/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '@tarpit/core'
import { TpProducer } from '../annotations'
import { Producer } from '../builtin'
import { ProduceUnit } from '../tools'
import { RabbitSessionCollector } from './rabbit-session-collector'

@TpService({ inject_root: true })
export class RabbitProducer {

    constructor(
        private sessions: RabbitSessionCollector,
    ) {
    }

    add_producer(meta: TpProducer, units: ProduceUnit[]) {
        for (const unit of units) {
            const producer = new Producer(unit.target, unit.routing_key, meta.injector!)
            this.sessions.add(producer.session)
            Object.defineProperty(unit.cls.prototype, unit.prop, {
                writable: true,
                enumerable: true,
                configurable: true,
                value: producer
            })
        }
    }
}
