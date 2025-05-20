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
    OnTerminate,
    Optional,
    TpAssembly,
    TpComponent,
    TpComponentProps,
    TpEntry,
    TpModule,
    TpRoot,
    TpService,
    TpUnit,
    TpWorker,
} from './annotations'

export { TpConfigData } from './builtin/tp-config-data'
export { TpLoader, TpLoaderType } from './builtin/tp-loader'
export { get_providers } from './tools/get-providers'

export { TpError, TpErrorDescription, throw_native_error } from './error/tp-error'

export {
    TarpitId,
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
