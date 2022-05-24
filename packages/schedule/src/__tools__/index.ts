/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { DI_TOKEN, MetaTools, TpMetaWrapper } from '@tarpit/core'
import { TpScheduleUnit } from '../__types__'
import default_unit_record = MetaTools.default_unit_record

export const ScheduleUnit = TpMetaWrapper<TpScheduleUnit<any>>(DI_TOKEN.unit, 'property_only',

    (prototype: any, property?: string | symbol): TpScheduleUnit<any> => {
        const [descriptor, prop] = MetaTools.check_property(prototype, property)
        const parameter_injection = MetaTools.default_property_meta(prototype, prop).value.parameter_injection
        const schedule_unit: TpScheduleUnit<any> = {
            type: 'TpScheduleUnit',
            prototype,
            descriptor,
            handler: descriptor.value,
            property: prop,
            param_types: MetaTools.get_method_parameter_types(prototype, prop)?.map((t: any, i: number) => parameter_injection[i] ?? t),
            crontab_str: '',
            name: 'unset'
        }
        default_unit_record(prototype)
            .do(touched => touched.set(prop, schedule_unit))
        return schedule_unit
    })

export const default_schedule_unit = (prototype: Object, prop: string | symbol) => ScheduleUnit(prototype, prop).ensure_default()
