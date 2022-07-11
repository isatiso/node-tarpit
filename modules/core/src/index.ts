/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

export * from './types'
export * from './annotations'
export * from './di'

// istanbul ignore file
export { TpInspector, STARTED_AT, START_TIME, TERMINATE_TIME, TERMINATED_AT } from './builtin/tp-inspector'
export { TpLogger } from './builtin/tp-logger'
export { TpLoader, TpLoaderType } from './builtin/tp-loader'
export { stringify } from './tools/stringify'
export { get_providers } from './tools/get-providers'
export {
    DecoratorInnerField,
    AbstractDecoratorFactory,
    DecoratorFactory,
    MixDecorator,
    make_abstract_decorator,
    make_decorator,
    get_class_decorator,
    get_class_parameter_decorator,
    get_method_parameter_decorator,
    get_prop_decorator,
    get_all_prop_decorator,
    get_prop_types,
    get_param_types,
} from './tools/decorator'

export { Platform } from './platform'
