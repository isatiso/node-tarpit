/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { DecoratorInstanceMethod } from '../__types__'
import { MetaTools } from '../__types__/__tools__/meta-tools'

/**
 * 用于标记一个 Function 类型中的一个方法为无效的。
 *
 * 目前支持这个装饰器的位置有：
 * - TpRouter 中的 @Route，@Get，@Post 等装饰器的方法。
 * - TpTrigger 中的 @Task
 *
 * 无效化是指挂载 Function 前检查 disabled 参数，跳过挂载过程。
 *
 * @category Common Annotation
 * @param disabled_options 目前没有可用的选项内容，后续可能会添加一些。
 */
export function Disabled(disabled_options?: {}): DecoratorInstanceMethod {
    return (prototype, prop, _) => {
        MetaTools.PropertyMeta(prototype, prop)
            .ensure_default()
            .do(meta => {
                meta.disabled = true
            })
    }
}
