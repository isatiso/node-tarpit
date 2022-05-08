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
    custom_data = 'œœ:custom_data',

    // inner metadata
    class_meta = 'œœ:class_meta',
    property_meta = 'œœ:property_meta',
    property_function = 'œœ:property_function',
    touched = 'œœ:touched',
    component_meta = 'œœ:component_meta',
    dependencies = 'œœ:dependencies',
    instance = 'œœ:instance',
}
