/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

export function detect_cycle_ref(token: any, parents?: any[]): void {
    const is_cycle_ref = parents?.indexOf(token) ?? -1
    if (is_cycle_ref >= 0) {
        const circle_path = parents?.slice(is_cycle_ref) ?? []
        circle_path.push(token)
        throw new Error('circle dependency: ' + circle_path.map(cls => cls.name).join(' => '))
    }
}
