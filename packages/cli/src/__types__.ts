import { Package } from 'normalize-package-data'

export type PackageJsonWorkspacePackageList = string[]

export interface PackageJsonWorkspace {
    packages?: PackageJsonWorkspacePackageList
    nohoist?: string[]
}

export interface PackageJson extends Package {
    workspaces?: PackageJsonWorkspacePackageList | PackageJsonWorkspace
}
