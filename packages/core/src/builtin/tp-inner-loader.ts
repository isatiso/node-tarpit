/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpEntry, TpModule, TpModuleToken, TpPlugin, TpPluginType, TpRoot, TpRootToken, TpService, TpServiceToken } from '../annotations'
import { Injector } from '../injector'
import { load_component } from '../tools/inner/load-component'
import { get_class_decorator } from '../tools/tp-decorator'

@TpPlugin({
    targets: [
        TpRootToken,
        TpModuleToken,
        TpServiceToken
    ]
})
export class TpInnerLoader implements TpPluginType {

    load(meta: any, injector: Injector): void {
        if (meta instanceof TpService) {

        } else if (meta instanceof TpModule) {

        } else if (meta instanceof TpRoot) {
            meta.entries?.map(p => get_class_decorator(p).find(d => d instanceof TpEntry))
                .filter(meta => meta)
                .forEach(meta => load_component(meta, injector))
            meta.provider?.create()
        }
    }

    async start() {
    }

    async terminate() {
    }
}
