/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { DI_TOKEN, MetaTools, TpMetaWrapper } from '@tarpit/core'
import { TpScheduleUnit } from '../__types__'

export const get_schedule_unit = TpMetaWrapper<TpScheduleUnit<any>>(
    DI_TOKEN.unit,
    'property_only',
    <T extends (...args: any) => any>(prototype: any, property?: string | symbol): TpScheduleUnit<T> => {

        const [descriptor, prop] = MetaTools.check_property(prototype, property)
        const parameter_injection = MetaTools.PropertyMeta(prototype, prop).value?.parameter_injection
        const schedule_unit: TpScheduleUnit<T> = {
            type: 'TpScheduleUnit',
            prototype,
            descriptor,
            handler: descriptor.value,
            property: prop,
            param_types: MetaTools.get_method_parameter_types(prototype, prop)?.map((t: any, i: number) => parameter_injection?.[i] ?? t) as Parameters<T>,
            crontab_str: '',
            name: 'unset'
        }
        MetaTools.UnitRecord(prototype)
            .ensure_default()
            .do(touched => touched.set(prop, schedule_unit))
        return schedule_unit
    })
