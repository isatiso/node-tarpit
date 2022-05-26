/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import CoBody from 'co-body'
import Koa from 'koa'

export class BodyParser {

    private readonly opts: CoBody.Options

    private jsonTypes = ['application/json', 'application/json-patch+json', 'application/vnd.api+json', 'application/csp-report']
    private formTypes = ['application/x-www-form-urlencoded']
    private textTypes = ['text/plain', 'text/xml', 'application/xml', 'text/html']

    constructor() {
        this.opts = { returnRawBody: true }
    }

    async parseBody(ctx: Koa.Context) {
        if (ctx.request.is(this.jsonTypes)) {
            return CoBody.json(ctx, this.opts)
        } else if (ctx.request.is(this.formTypes)) {
            return CoBody.form(ctx, this.opts)
        } else if (ctx.request.is(this.textTypes)) {
            return CoBody.text(ctx, this.opts).then((v: any) => v || '')
        } else {
            return {}
        }
    }
}
