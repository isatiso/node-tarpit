/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '@tarpit/core'
import { TpHttpAuthInfo } from '../../__types__'
import { TpRequest } from '../../builtin'
import { AbstractAuthenticator } from '../inner/abstract-authenticator'

@TpService()
export class TpAuthenticator extends AbstractAuthenticator {

    override async auth(request: TpRequest): Promise<TpHttpAuthInfo | undefined> {
        return {}
    }
}
