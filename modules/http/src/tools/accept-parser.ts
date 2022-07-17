/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import mime from 'mime-types'
import Negotiator from 'negotiator'

export function ext_to_mime(type: string): string | undefined {
    return type.indexOf('/') === -1
        ? (mime.lookup(type) || undefined)
        : type
}

export type IncomingMessageLike = {
    headers: {
        [key: string]: string | string[] | undefined;
    }
}

export class AcceptParser {

    private headers = this.req.headers
    private negotiator = new Negotiator(this.req)

    constructor(private req: IncomingMessageLike) {
    }

    types(): string[]
    types(...types: string[]): string | undefined
    types(...types: string[]): string[] | string | undefined {

        if (!types.length) {
            return this.negotiator.mediaTypes()
        }

        if (!this.headers.accept) {
            return types[0]
        }

        const mimes = types.map(ext_to_mime).filter((m): m is string => !!m)
        const accepts = this.negotiator.mediaTypes(mimes)
        const first = accepts[0]

        return first ? types[mimes.indexOf(first)] : undefined
    }

    encodings(): string[]
    encodings(...encodings: string[]): string | undefined
    encodings(...encodings: string[]): string[] | string | undefined {

        if (!encodings.length) {
            return this.negotiator.encodings()
        }

        return this.negotiator.encodings(encodings)[0] || undefined
    }

    charsets(): string[]
    charsets(...charsets: string[]): string | undefined
    charsets(...charsets: string[]): string[] | string | undefined {

        if (!charsets.length) {
            return this.negotiator.charsets()
        }

        return this.negotiator.charsets(charsets)[0] || undefined
    }

    languages(): string[]
    languages(...languages: string[]): string | undefined
    languages(...languages: string[]): string[] | string | undefined {

        if (!languages.length) {
            return this.negotiator.languages()
        }

        return this.negotiator.languages(languages)[0] || undefined
    }
}
