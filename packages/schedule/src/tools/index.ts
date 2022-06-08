/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Constructor, Disabled, get_all_prop_decorator } from '@tarpit/core'
import { TaskOptions } from '../__types__'
import { Sherlock, Task, TpSchedule } from '../annotations'

// export const ScheduleUnit = TpMetaWrapper<TpScheduleUnit<any>>(DI_TOKEN.unit)
//
// export const default_schedule_unit = (prototype: Object, prop: string | symbol) => ScheduleUnit(prototype, prop).ensure_default((prototype: any, property?: string | symbol): TpScheduleUnit<any> => {
//     const [descriptor, prop] = MetaTools.check_property(prototype, property)
//     const schedule_unit: TpScheduleUnit<any> = {
//         u_type: 'TpScheduleUnit',
//         u_desc: descriptor,
//         u_handler: descriptor.value,
//         u_prop: prop,
//         u_proto: prototype,
//         us_crontab_str: '',
//         us_name: 'unset',
//     }
//     MetaTools.default_unit_record(prototype)
//         .do(touched => touched.set(prop, schedule_unit))
//     return schedule_unit
// })

export type TaskUnit = {
    task_name: string
    crontab_str: string
    lock_key?: string
    lock_expire_secs?: number
    options: TaskOptions
    position: string
    handler: Function
    cls: Constructor<any>
    prop: string | symbol
}

export function collect_tasks(meta: TpSchedule): TaskUnit[] {
    const units: TaskUnit[] = []

    iterate_prop: for (const [prop, decorators] of get_all_prop_decorator(meta.cls) ?? []) {
        const prop_meta: TaskUnit = {
            task_name: '',
            crontab_str: '',
            options: {},
            position: `${meta.cls.name}.${prop.toString()}`,
            handler: Reflect.getOwnPropertyDescriptor(meta.cls.prototype, prop)?.value.bind(meta.instance),
            cls: meta.cls,
            prop: prop,
        }
        for (const d of decorators) {
            if (d instanceof Task) {
                prop_meta.task_name = d.name
                prop_meta.crontab_str = d.crontab
                prop_meta.options = d.options ?? {}
            } else if (d instanceof Sherlock) {
                prop_meta.lock_key = d.key
                prop_meta.lock_expire_secs = d.expire_secs
            } else if (d instanceof Disabled) {
                continue iterate_prop
            }
        }
        if (prop_meta.crontab_str) {
            units.push(prop_meta)
        }
    }
    return units
}
