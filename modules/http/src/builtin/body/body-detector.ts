/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ContentTypeService, MIMEContent } from '@tarpit/content-type'
import { JsonBody } from './json-body'

export type DetectedBodyType<T> =
    | { type: 'json', body: JsonBody<T> }
    | { type: 'text', body: string }
    | { type: 'buffer', body: Buffer }
    | { type: 'unknown', body: Buffer }
    | { type: 'custom', body: any }

function is_object(value: any) {
    return Object.prototype.toString.call(value) === '[object Object]'
}

export class BodyDetector<R = unknown> {

    private type: string | undefined
    private charset: string | undefined
    private readonly raw: Buffer
    private text: string | undefined
    private body: any
    private resolved?: DetectedBodyType<any>

    constructor(
        private content_type: ContentTypeService,
        private content: MIMEContent<any>
    ) {
        this.type = this.content.type
        this.charset = this.content.charset
        this.raw = this.content.raw
    }

    async detect(): Promise<DetectedBodyType<R>> {

        if (this.resolved) {
            return this.resolved
        }

        await this.content_type.deserialize(this.content)
        this.text = this.content.text
        this.body = this.content.data

        if (is_object(this.body)) {
            return this.resolved = { type: 'json', body: new JsonBody<R>(this.body) }
        } else if (typeof this.body === 'string') {
            return this.resolved = { type: 'text', body: this.body }
        } else if (Buffer.isBuffer(this.body)) {
            return this.resolved = { type: 'buffer', body: this.body }
        } else if (this.body) {
            return this.resolved = { type: 'custom', body: this.body }
        } else {
            return this.resolved = { type: 'unknown', body: this.raw }
        }
    }
}
