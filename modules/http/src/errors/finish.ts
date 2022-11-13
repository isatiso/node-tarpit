/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpHttpResponseType } from '../__types__'

export class Finish {
    constructor(
        public readonly response: TpHttpResponseType
    ) {
    }
}

export function finish(response: TpHttpResponseType): never {
    throw new Finish(response)
}
