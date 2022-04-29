/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { TokenUtils } from '../../token-utils'
import { DecoratorClass, DecoratorInstanceMethod } from '../__types__'

/**
 * 这是一个调试用的装饰器。
 * 在一个 TpComponent 上使用 `@EchoDependencies` 会在加载组件时将入参类型打印到控制台。
 * 这里的类型是指在被 Inject 装饰器替换之前的。
 *
 * @category Common Annotation
 */
export function EchoDependencies(): DecoratorClass {
    return constructor => {
        console.log(`${constructor.name} dependencies`, TokenUtils.get_constructor_parameter_types(constructor))
        TokenUtils.Dependencies(constructor.prototype).ensure_default()
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
export function EchoMethodDependencies(): DecoratorInstanceMethod {
    return (prototype, prop, _) => {
        TokenUtils.Dependencies(prototype).ensure_default().do(dependencies => {
            dependencies[prop] = TokenUtils.get_method_parameter_types(prototype, prop)
        })
    }
}
