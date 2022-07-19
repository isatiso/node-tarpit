/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { TriggerContext } from '../../builtin/trigger-context'

export abstract class AbstractTriggerHooks {

    abstract on_init(context: TriggerContext): Promise<void>

    abstract on_finish<T>(context: TriggerContext, res: T): Promise<void>

    abstract on_error(context: TriggerContext, err: any): Promise<void>
}
