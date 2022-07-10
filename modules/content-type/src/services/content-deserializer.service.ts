/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Injector } from '@tarpit/core'
import { decompressor_token, deserializer_token } from '../tokens'
import { filter_provider } from '../tools/filter-provider'
import { MIMEContent } from '../types'

export class ContentDeserializerService {

    private _deserializer = new Map<string, (content: MIMEContent<any>) => any>()

    constructor(
        private injector: Injector,
    ) {
        this.injector.on('provider-change', token => token === decompressor_token && this.load_deserializer())
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
