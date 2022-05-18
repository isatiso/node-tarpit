/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { Package } from 'normalize-package-data'

export type PackageJsonWorkspacePackageList = string[]

export interface PackageJsonWorkspace {
    packages?: PackageJsonWorkspacePackageList
    nohoist?: string[]
}

export interface PackageJson extends Package {
    workspaces?: PackageJsonWorkspacePackageList | PackageJsonWorkspace
}
