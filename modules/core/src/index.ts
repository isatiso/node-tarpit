/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

// istanbul ignore file

export * from './types'

export { Injector, ClassProvider, ValueProvider, FactoryProvider } from './di'

export {
    Debug,
    Disabled,
    Inject,
    OnStart,
    OnTerminate,
    Optional,
    TpAssembly,
    TpComponent,
    TpEntry,
    TpModule,
    TpRoot,
    TpService,
    TpUnit,
    TpWorker,
} from './annotations'
export type { TpComponentProps } from './annotations'

export { TpConfigData } from './builtin/tp-config-data'
export { TpLoader } from './builtin/tp-loader'
export type { TpLoaderType } from './builtin/tp-loader'

export { get_providers } from './tools/get-providers'

export { TpError, throw_native_error } from './error/tp-error'
export type { TpErrorDescription } from './error/tp-error'

export {
    TarpitId,
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
export type {
    DecoratorInnerField,
    AbstractDecoratorFactory,
    DecoratorFactory,
    MixDecorator,
} from './tools/decorator'

export { Platform } from './platform'
