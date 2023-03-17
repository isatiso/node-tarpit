/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { get_param_types, get_prop_types } from '../tools/decorator'

export function Debug() {
    return (target: any, prop?: string | symbol | undefined, desc?: TypedPropertyDescriptor<any> | number | undefined) => {
        const cls = target.prototype?.constructor === target ? target : target.constructor
        if (prop) {
            if (typeof desc === 'number') {
                Debug.log(`${cls.name}.${prop.toString()}.args[${desc}] type`, get_param_types(cls, prop)![desc])
            } else if (desc) {
                Debug.log(`${cls.name}.${prop.toString()} dependencies`, get_param_types(cls, prop))
            } else {
                Debug.log(`${cls.name}.${prop.toString()} type`, get_prop_types(cls, prop))
            }
        } else {
            if (typeof desc === 'number') {
                Debug.log(`${cls.name}.args[${desc}] type`, get_param_types(cls, prop)![desc])
            } else {
                Debug.log(`${cls.name} dependencies`, get_param_types(cls, prop))
            }
        }
    }
}

Debug.log = console.info
