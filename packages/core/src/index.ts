/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

export * from './types'

export {
    Disabled,
    Inject,
    MetaData,
    OnDestroy,
    Optional,
    TpAssembly,
    TpComponent,
    TpComponentProps,
    TpEntry,
    TpModule,
    TpPlugin,
    TpPluginType,
    TpRoot,
    TpService,
    TpUnit,
    TpWorker,
    Debug,
} from './annotations'
export { Injector } from './injector'
export { ClassProvider, FactoryProvider, ValueProvider } from './provider'
export { Deque } from './builtin/deque'
export { TpInspector, STARTED_AT, START_TIME, TERMINATE_TIME, TERMINATED_AT } from './builtin/tp-inspector'
export { TpLogger } from './builtin/tp-logger'
export { UUID } from './builtin/uuid'
export { stringify } from './tools/stringify'
export { Platform } from './platform'
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
} from './tools/tp-decorator'
export { get_providers } from './tools/get-providers'
