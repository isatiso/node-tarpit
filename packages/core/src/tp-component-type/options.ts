/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Constructor, ProviderDef } from '../__types__'

export interface ImportsAndProviders {
    imports?: Array<Constructor<any>>
    providers?: (ProviderDef<any> | Constructor<any>)[]
}

export interface TpModuleOptions extends ImportsAndProviders {
}

export interface TpServiceOptions {
    echo_dependencies?: boolean
}

export interface TpRootOptions extends ImportsAndProviders {

}
