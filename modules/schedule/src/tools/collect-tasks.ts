/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Constructor, Disabled, get_all_prop_decorator } from '@tarpit/core'
import { TaskOptions } from '../__types__'
import { Task, TpSchedule } from '../annotations'

export type TaskUnit = {
    task_name: string
    crontab_str: string
    options: TaskOptions
    position: string
    handler: Function
    cls: Constructor<any>
    prop: string | symbol
}

export function collect_tasks(meta: TpSchedule): TaskUnit[] {

    const units: TaskUnit[] = []

    iterate_prop: for (const [prop, decorators] of get_all_prop_decorator(meta.cls) ?? []) {
        const descriptor = Reflect.getOwnPropertyDescriptor(meta.cls.prototype, prop)
        if (!descriptor) {
            continue
        }
        const prop_meta: TaskUnit = {
            task_name: '',
            crontab_str: '',
            options: {},
            position: `${meta.cls.name}.${prop.toString()}`,
            handler: descriptor.value.bind(meta.instance),
            cls: meta.cls,
            prop: prop,
        }
        for (const d of decorators) {
            if (d instanceof Task) {
                prop_meta.task_name = d.name
                prop_meta.crontab_str = d.crontab
                prop_meta.options = d.options ?? {}
            } else if (d instanceof Disabled) {
                continue iterate_prop
            }
        }
        units.push(prop_meta)
    }
    return units
}
