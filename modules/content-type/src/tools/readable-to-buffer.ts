/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpError } from '@tarpit/error'
import { Readable } from 'stream'

export async function readable_to_buffer(stream: Readable): Promise<Buffer> {

    return new Promise<Buffer>((resolve, reject) => {
        const buffers: Buffer[] = []

        function finish(value: Error | Buffer) {
            stream.removeAllListeners()
            return Buffer.isBuffer(value) ? resolve(value) : reject(value)
        }

        stream.on('end', () => finish(Buffer.concat(buffers)))
        stream.on('error', err => finish(err))
        stream.on('data', chunk => buffers.push(chunk))
        stream.on('close', () => finish(new TpError({ code: 'ECONNABORTED', msg: 'Connection aborted' })))
    })
}
