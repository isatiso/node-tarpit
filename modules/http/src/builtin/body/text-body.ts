/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { MIMEContent, text_deserialize } from '@tarpit/content-type'

export class TextBody extends String {
    constructor(content: MIMEContent<any>) {
        super(text_deserialize(content))
    }
}
