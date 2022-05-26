/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */
import { KoaResponseType } from '../__types__'
import { SessionContext } from '../builtin/session-context'
import { AbstractResultWrapper } from './abstract-result-wrapper'

export class TpResultWrapper extends AbstractResultWrapper {

    wrap(result: any, context: SessionContext): KoaResponseType | undefined {
        return result
    }

    wrap_error<T = any>(err: T, context: SessionContext): KoaResponseType | undefined {
        return { error: err }
    }

}
