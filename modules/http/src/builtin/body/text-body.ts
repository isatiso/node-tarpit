/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { MIMEContent, text_deserialize } from '@tarpit/content-type'
import { TpRequest } from '../tp-request'

export class TextBody extends String {

    static parse(request: TpRequest, content: MIMEContent<any>) {
        return text_deserialize(content)
    }
}
