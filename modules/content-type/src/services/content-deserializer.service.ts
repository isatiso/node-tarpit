/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Injector, TpService } from '@tarpit/core'
import { takeUntil, tap } from 'rxjs'
import { decompressor_token, deserializer_token } from '../tokens'
import { filter_provider } from '../tools/filter-provider'
import { MIMEContent } from '../types'

@TpService({ inject_root: true })
export class ContentDeserializerService {

    private _deserializer = new Map<string, (content: MIMEContent<any>) => any>()

    constructor(
        private injector: Injector,
    ) {
        this.injector.provider_change$.pipe(
            tap(token => token === decompressor_token && this.load_deserializer()),
            takeUntil(this.injector.off$),
        ).subscribe()
        this.load_deserializer()
    }

    async deserialize(content: MIMEContent<any>): Promise<MIMEContent<any>> {
        if (content.type) {
            const deserializer = this._deserializer.get(content.type)
            if (deserializer) {
                content.data = await deserializer(content)
            }
        }
        return content
    }

    private load_deserializer() {
        filter_provider(this.injector.get(deserializer_token)?.create())
            .forEach(([key, func]) => this._deserializer.set(key.toLowerCase(), func as any))
    }
}
