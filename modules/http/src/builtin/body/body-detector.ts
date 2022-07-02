/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpRequest } from '../tp-request'
import { FormBody } from './form-body'
import { JsonBody } from './json-body'
import { RawBody } from './raw-body'
import { TextBody } from './text-body'

export type DetectedBodyType<R> =
    | { type: 'json', body: JsonBody<R> }
    | { type: 'form', body: FormBody<R> }
    | { type: 'text', body: string }
    | { type: 'buffer', body: Buffer }

export class BodyDetector {

    private static jsonTypes: [string, ...string[]] = ['application/json', 'application/json-patch+json', 'application/vnd.api+json', 'application/csp-report']
    private static formTypes: [string, ...string[]] = ['application/x-www-form-urlencoded']
    private static textTypes: [string, ...string[]] = ['text/plain', 'text/xml', 'application/xml', 'text/html']

    private readonly type: 'json' | 'form' | 'text' | 'buffer'
    private readonly body: any

    constructor(
        private request: TpRequest,
        private buf: Buffer
    ) {
        if (this.request.is(...BodyDetector.jsonTypes)) {
            this.type = 'json'
            this.body = JsonBody.parse(this.request, this.buf)
        } else if (this.request.is(...BodyDetector.formTypes)) {
            this.type = 'form'
            this.body = FormBody.parse(this.request, this.buf)
        } else if (this.request.is(...BodyDetector.textTypes)) {
            this.type = 'text'
            this.body = TextBody.parse(this.request, this.buf) || ''
        } else {
            this.type = 'buffer'
            this.body = RawBody.parse(this.request, this.buf)
        }
    }

    static parse(request: TpRequest, buf: Buffer) {
        return new BodyDetector(request, buf)
    }

    detect<R = unknown>(): DetectedBodyType<R> {
        const { type, body } = this
        return { type, body }
    }
}
