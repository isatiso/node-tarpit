/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { get_prop_types, TpService } from '@tarpit/core'
import { TpProducer } from '../annotations'
import { ConfirmProducer, Producer } from '../builtin'
import { ProduceUnit } from '../tools'
import { RabbitSessionCollector } from './rabbit-session-collector'

@TpService({ inject_root: true })
export class RabbitProducer {

    constructor(
        private sessions: RabbitSessionCollector,
    ) {
    }

    add(meta: TpProducer, units: ProduceUnit[]) {
        for (const unit of units) {
            const type = get_prop_types(unit.cls, unit.prop)
            let producer: Producer<any> | ConfirmProducer<any>
            if (type === Producer) {
                producer = new Producer(unit.target, unit.routing_key, meta.injector!)
            } else if (type === ConfirmProducer) {
                producer = new ConfirmProducer(unit.target, unit.routing_key, meta.injector!)
                this.sessions.add(producer)
            } else {
                throw new Error(`Unknown producer type ${type} at ${unit.position}`)
            }
            Object.defineProperty(unit.cls.prototype, unit.prop, {
                writable: true,
                enumerable: true,
                configurable: true,
                value: producer
            })
        }
    }
}
