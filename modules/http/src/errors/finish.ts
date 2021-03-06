/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

export class Finish {
    constructor(
        public readonly response: any
    ) {
    }
}

export function finish(response: any): never {
    throw new Finish(response)
}
