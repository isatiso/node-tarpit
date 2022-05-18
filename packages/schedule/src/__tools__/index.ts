/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { DI_TOKEN, MetaTools, MetaWrapper, TokenTools } from '@tarpit/core'
import { ScheduleFunction } from '../__types__'

export const get_schedule_function = MetaWrapper<ScheduleFunction<any>>(
    DI_TOKEN.property_function,
    'property_only',
    <T extends (...args: any) => any>(prototype: any, property?: string): ScheduleFunction<T> => {

        const [descriptor, prop] = MetaTools.check_property(prototype, property)
        const parameter_injection = MetaTools.PropertyMeta(prototype, prop).value?.parameter_injection
        const schedule_function: ScheduleFunction<T> = {
            type: 'TpScheduleFunction',
            prototype,
            descriptor,
            handler: descriptor.value,
            property: prop,
            param_types: MetaTools.get_method_parameter_types(prototype, prop)?.map((t: any, i: number) => parameter_injection?.[i] ?? t) as Parameters<T>,
            crontab_str: '',
            name: 'unset'
        }
        TokenTools.FunctionRecord(prototype).ensure_default().do(touched => {
            touched[prop] = schedule_function
        })
        return schedule_function
    })
