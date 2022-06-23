/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Injector } from '../di'
import { make_abstract_decorator } from '../tools/decorator'
import { ImportsAndProviders } from '../types'

export type TpBaseOptions = { inject_root?: boolean }
export type TpComponentProps = { token: symbol, instance?: any }
export type TpEntryProps = { injector?: Injector }

export type TpComponent = InstanceType<typeof TpComponent>
export const TpComponent = make_abstract_decorator<TpComponentProps & TpBaseOptions>('TpComponent')

export type TpWorker = InstanceType<typeof TpWorker>
export const TpWorker = make_abstract_decorator<TpComponentProps & TpBaseOptions>('TpWorker', TpComponent)

export type TpAssembly = InstanceType<typeof TpAssembly>
export const TpAssembly = make_abstract_decorator<ImportsAndProviders & TpComponentProps & TpBaseOptions>('TpAssembly', TpComponent)

export type TpEntry = InstanceType<typeof TpEntry>
export const TpEntry = make_abstract_decorator<ImportsAndProviders & TpComponentProps & TpEntryProps & TpBaseOptions>('TpEntry', TpAssembly)

export type TpUnit = InstanceType<typeof TpUnit>
export const TpUnit = make_abstract_decorator('TpUnit')
