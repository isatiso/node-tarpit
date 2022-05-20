/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { MetaTools } from '../__tools__/tp-meta-tools'

/**
 * 由于 Typescript 中具有值和类型双重身份的只有 Class 和 Enum。
 * 所以当你需要使用 Class 和 Enum 以外的值进行依赖查找时，可以使用此装饰器，显示指定一个非类型的值作为查找 token。
 *
 * *比如使用一些特殊的字符串。*
 *
 * > 在 typescript 中实现依赖注入时，用来查找依赖项的 token 需要满足条件：[即是值，又是类型](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#basic-concepts)。
 * >
 * > 在当前的 typescript 版本中（< 4.4.2），满足这个条件的概念只有 Class 和 Enum。
 * >
 * > 要使用其他的值表示类型单纯通过 reflect-metadata 就做不到了。`@Inject` 就是一种辅助实现方式。
 *
 * @category Common Annotation
 * @param token - 任何可以通过 === 进行相等判断的值。一般会选择具有某些含义的字符串。
 */
export function Inject(token: any): ParameterDecorator | ClassDecorator {
    if (token === undefined) {
        throw new Error(`You can not inject a "undefined".`)
    }
    return (target: Function | Object, prop: string | symbol | undefined, index: number) => {
        if (prop === undefined) {
            MetaTools.ClassMeta((target as Function).prototype).ensure_default().do(meta => meta.parameter_injection[index] = token)
        } else {
            MetaTools.PropertyMeta(target, prop).ensure_default().do(meta => meta.parameter_injection[index] = token)
        }
    }
}
