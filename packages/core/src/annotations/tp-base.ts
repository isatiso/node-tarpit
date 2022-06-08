/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { make_abstract_decorator } from '../tools/tp-decorator'
import { ImportsAndProviders } from '../types'

export type TpComponentProps = { token: symbol }
export type TpEntryProps = { instance?: any }

export type TpComponent = InstanceType<typeof TpComponent>
export const TpComponent = make_abstract_decorator<TpComponentProps>('TpComponent')

export type TpWorker = InstanceType<typeof TpWorker>
export const TpWorker = make_abstract_decorator<TpComponentProps>('TpWorker', TpComponent)

export type TpAssembly = InstanceType<typeof TpAssembly>
export const TpAssembly = make_abstract_decorator<ImportsAndProviders & TpComponentProps>('TpAssembly', TpComponent)

export type TpEntry = InstanceType<typeof TpEntry>
export const TpEntry = make_abstract_decorator<ImportsAndProviders & TpComponentProps & TpEntryProps>('TpEntry', TpAssembly)

export type TpUnit = InstanceType<typeof TpUnit>
export const TpUnit = make_abstract_decorator('TpUnit')
