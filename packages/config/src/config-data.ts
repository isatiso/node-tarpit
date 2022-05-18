/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Path, PathValue, Reference } from '@tarpit/judge'

/**
 * 通过全局声明合并扩展 TpConfigSchema。
 *
 * [[include:builtin/config-data.md]]
 *
 * @category ConfigSchema
 */
export interface TpConfigSchema {

}

/**
 * 内置的全局配置内容查找服务。
 *
 * 通过调用 [[Platform.load_config]] 可以加载配置文件，并将配置内容保存到 "ConfigData" 中。
 *
 * NPM 包 [tp-check](https://www.npmjs.com/package/tp-check) 提供了一种检查位置文件是否符合类型 <TpConfigSchema> 的方法。
 *
 * [[include:builtin/config-data.md]]
 *
 * @category Builtin
 */
export class ConfigData extends Reference<TpConfigSchema> {

    /**
     * @param data 配置文件内容。
     */
    constructor(
        data: TpConfigSchema
    ) {
        super(data)
    }

    /**
     * 返回完整配置对象。
     */
    get(): TpConfigSchema
    /**
     * 查找指定路径的配置。
     *
     * @param path JSON 路径。
     */
    get<K extends Path<TpConfigSchema>>(path: K): PathValue<TpConfigSchema, K>
    get<K extends Path<TpConfigSchema>>(path?: K): PathValue<TpConfigSchema, K> | TpConfigSchema {
        if (!path) {
            return super.get()
        }
        return super.get(path)!
    }
}

