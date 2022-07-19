/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ConfigData } from '@tarpit/config'
import { TpService } from '@tarpit/core'
import url, { UrlWithParsedQuery } from 'url'

export type RequestInfo = {
    url: string | undefined
    headers: NodeJS.Dict<string | string[]>
}

export function get_first(value: string | string[] | undefined) {
    if (Array.isArray(value)) {
        return value[0]
    } else {
        return value
    }
}

@TpService({ inject_root: true })
export class HttpUrlParser {

    private proxy_config = this.config_data.get('http.proxy')

    constructor(
        private config_data: ConfigData,
    ) {
    }

    parse(request_info: RequestInfo): UrlWithParsedQuery | undefined {
        try {
            const request_url = request_info.url ?? '/'
            if (/^https?:\/\//i.test(request_url)) {
                return url.parse(request_url, true)
            } else {
                return url.parse(this.figure_origin(request_info) + request_url, true)
            }
        } catch (e: any) {
            return
        }
    }

    private figure_origin(info: RequestInfo) {
        return `http://${this.figure_host(info.headers)}`
    }

    private figure_host(headers: NodeJS.Dict<string | string[]>): string {
        if (this.proxy_config?.enable) {
            const forwarded_host = get_first(headers['x-forwarded-host'])
            if (forwarded_host) {
                return forwarded_host.split(/\s*,\s*/, 1)[0]
            }
        }
        return get_first(headers['host']) ?? 'localhost'
    }
}
