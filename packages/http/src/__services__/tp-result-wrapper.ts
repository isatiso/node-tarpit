/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { KoaResponseType } from '../__types__'
import { SessionContext } from '../builtin'
import { AbstractResultWrapper } from './abstract-result-wrapper'

export class TpResultWrapper extends AbstractResultWrapper {

    wrap(result: any, context: SessionContext): KoaResponseType {
        return result
    }

    wrap_error<T = any>(err: T, context: SessionContext): KoaResponseType {
        return { error: err }
    }
}
