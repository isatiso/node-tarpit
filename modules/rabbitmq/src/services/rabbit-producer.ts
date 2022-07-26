/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '@tarpit/core'
import { TpProducer } from '../annotations'
import { ConfirmProducer } from '../builtin/confirm-producer'
import { Producer } from '../builtin/producer'
import { ProduceUnit } from '../tools/collect-produces'
import { RabbitSessionCollector } from './rabbit-session-collector'

function define_property(prototype: any, prop: string | symbol, value: Producer<any> | ConfirmProducer<any>) {
    Object.defineProperty(prototype, prop, {
        writable: true,
        enumerable: true,
        configurable: true,
        value
    })
}

@TpService({ inject_root: true })
export class RabbitProducer {

    constructor(
        private sessions: RabbitSessionCollector,
    ) {
    }

    add(meta: TpProducer, units: ProduceUnit[]) {
        for (const unit of units) {
            switch (unit.producer_type) {
                case Producer:
                    define_property(unit.cls.prototype, unit.prop, new Producer(unit.target, unit.routing_key, meta.injector!))
                    break
                case ConfirmProducer:
                    const producer = new ConfirmProducer(unit.target, unit.routing_key, meta.injector!)
                    this.sessions.add(producer)
                    define_property(unit.cls.prototype, unit.prop, producer)
                    break
            }
        }
    }
}
