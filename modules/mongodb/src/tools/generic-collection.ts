/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */
import { Collection } from 'mongodb'

export class StubCollection {

}

export function GenericCollection<DOC extends object>(): {
    new(): Collection<DOC>
    prototype: Collection<DOC>
} {
    return StubCollection as any
}
