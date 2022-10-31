/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */
import { Collection } from 'mongodb'

export function GenericCollection<DOC extends object>() {
    return Collection<DOC>
}
