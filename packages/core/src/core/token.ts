/**
 * Copyright (c) Plank Root.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import 'reflect-metadata'

/**
 * @private
 * 用于通过反射存取数据的 metadataKey 集合。
 */
export enum DI_TOKEN {
    // user custom metadata
    custom_data = 'lazor:custom_data',

    // inner metadata
    class_meta = 'lazor:class_meta',
    property_meta = 'lazor:property_meta',
    property_function = 'lazor:property_function',
    touched = 'lazor:touched',
    component_meta = 'lazor:component_meta',
    dependencies = 'lazor:dependencies',
    instance = 'lazor:instance',
}
