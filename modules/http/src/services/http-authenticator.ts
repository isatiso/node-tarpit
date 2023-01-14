/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '@tarpit/core'
import { Jtl } from '@tarpit/judge'
import { HttpCredentials } from '../__types__'
import { Guard, TpRequest } from '../builtin'
import { throw_unauthorized } from '../errors'

@TpService({ inject_root: true })
export class HttpAuthenticator {

    async get_credentials(request: TpRequest): Promise<HttpCredentials | undefined> {
        const [type, credentials] = request.get('Authorization')?.split(' ') ?? []
        if (type && credentials) {
            return { type, credentials }
        }
    }

    async authenticate(guard: Guard): Promise<void> {
        guard.ensure('type', Jtl.exist, () => {
            throw_unauthorized({ msg: 'credentials not exists', headers: { 'WWW-Authenticate': 'Basic' } })
        })
    }
}
