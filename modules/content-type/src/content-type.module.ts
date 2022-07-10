/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */
import { TpModule } from '@tarpit/core'
import { Readable } from 'stream'
import zlib from 'zlib'
import { form_deserialize } from './builtin/form'
import { json_deserialize } from './builtin/json'
import { text_deserialize } from './builtin/text'
import { ContentDecompressorService } from './services/content-decompressor.service'
import { ContentDeserializerService } from './services/content-deserializer.service'
import { ContentReaderService } from './services/content-reader.service'
import { decompressor_token, deserializer_token } from './tokens'
import { MIMEContent } from './types'

@TpModule({
    providers: [
        ContentDecompressorService,
        ContentDeserializerService,
        ContentReaderService,
        { provide: decompressor_token, useValue: ['br', (req: Readable) => req.pipe(zlib.createBrotliDecompress())], multi: true, root: true },
        { provide: decompressor_token, useValue: ['gzip', (req: Readable) => req.pipe(zlib.createGunzip())], multi: true, root: true },
        { provide: decompressor_token, useValue: ['deflate', (req: Readable) => req.pipe(zlib.createInflate())], multi: true, root: true },
        { provide: deserializer_token, useValue: ['text/plain', text_deserialize], multi: true, root: true },
        { provide: deserializer_token, useValue: ['text/html', text_deserialize], multi: true, root: true },
        { provide: deserializer_token, useValue: ['text/xml', text_deserialize], multi: true, root: true },
        { provide: deserializer_token, useValue: ['application/json', json_deserialize], multi: true, root: true },
        { provide: deserializer_token, useValue: ['application/octet-stream', (content: MIMEContent<any>) => content.raw], multi: true, root: true },
        { provide: deserializer_token, useValue: ['application/x-www-form-urlencoded', form_deserialize], multi: true, root: true },
    ]
})
export class ContentTypeModule {

}
