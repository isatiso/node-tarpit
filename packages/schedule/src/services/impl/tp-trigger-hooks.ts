/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TpService } from '@tarpit/core'
import { TriggerContext } from '../../builtin/trigger-context'
import { AbstractTriggerHooks } from '../inner/abstract-trigger-hooks'

@TpService()
export class TpTriggerHooks extends AbstractTriggerHooks {

    on_init(context: TriggerContext): Promise<void> {
        return Promise.resolve(undefined)
    }

    on_finish<T>(context: TriggerContext, res: T): Promise<void> {
        return Promise.resolve(undefined)
    }

    on_error(context: TriggerContext, err: any): Promise<void> {
        return Promise.resolve(undefined)
    }
}
