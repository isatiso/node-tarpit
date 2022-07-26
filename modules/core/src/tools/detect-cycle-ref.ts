/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ParentDesc } from '../types'
import { stringify } from './stringify'

export function detect_cycle_ref(token: any, parents?: ParentDesc[]): void {
    if (!parents?.length) {
        return
    }
    const self_index = parents.findIndex(p => token === p.token)
    if (self_index >= 0) {
        const circle_path = parents.slice(self_index)
        circle_path.push(parents[self_index])
        throw new Error('circle dependency: ' + circle_path.map(cls => stringify(cls.token) + `[${cls.index ?? ''}]`).join(' => '))
    }
}
