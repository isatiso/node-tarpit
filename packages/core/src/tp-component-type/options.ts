/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { ImportsAndProviders } from './common'

export interface TpModuleOptions extends ImportsAndProviders {
}

export interface TpServiceOptions {
    echo_dependencies?: boolean
}

export interface TpRootOptions extends ImportsAndProviders {

}
