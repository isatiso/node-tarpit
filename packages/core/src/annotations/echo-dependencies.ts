/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { MetaTools } from '../__tools__/tp-meta-tools'

/**
 * 这是一个调试用的装饰器。
 * 在一个 TpComponent 上使用 `@EchoDependencies` 会在加载组件时将入参类型打印到控制台。
 * 这里的类型是指在被 Inject 装饰器替换之前的。
 *
 * @category Common Annotation
 */
export function EchoDependencies(): ClassDecorator {
    return constructor => {
        console.log(`${constructor.name} dependencies`, MetaTools.get_constructor_parameter_types(constructor))
        MetaTools.Dependencies(constructor.prototype).ensure_default()
            .do(dependencies => {
                Object.keys(dependencies).forEach(propertyKey => {
                    console.log(`${constructor.name}.${propertyKey} dependencies`, dependencies[propertyKey])
                })
            })
    }
}

/**
 * 这是一个调试用的装饰器。
 * 在一个 TpComponent 上使用 `@EchoDependencies` 会在加载组件时将入参类型打印到控制台。
 * 这里的类型是指在被 Inject 装饰器替换之前的。
 *
 * **注意**：由于在执行方法装饰器时无法拿到类名，所以使用 `EchoMethodDependencies` 输出方法参数时，必须在 class 上同时标记 `EchoDependencies` 使用。单独使用 `EchoMethodDependencies` 不会输出任何内容。
 *
 * @category Common Annotation
 */
export function EchoMethodDependencies(): MethodDecorator {
    return (prototype, prop, _) => {
        MetaTools.Dependencies(prototype).ensure_default().do(dependencies => {
            dependencies[prop] = MetaTools.get_method_parameter_types(prototype, prop)
        })
    }
}
