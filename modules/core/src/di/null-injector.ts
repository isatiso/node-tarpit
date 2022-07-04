/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { InjectorType, Provider } from '../types'

export class NullInjector implements InjectorType {

    readonly id = 0
    readonly children: any[] = []

    has(_token: any) {
        return false
    }

    get(_token: any): Provider<any> | undefined {
        return
    }
}
