import { Constructor } from '../annotation'

export type ProviderDef<T extends object> = ValueProviderDef | ClassProviderDef<T> | FactoryProviderDef

export interface ValueProviderDef {
    provide: any
    useValue: any
}

export interface ClassProviderDef<T extends object> {
    provide: T
    useClass: Constructor<T>
    multi?: boolean
}

export interface FactoryProviderDef {
    provide: any
    useFactory: Function
    deps?: any[]
}

export interface Provider<T> {
    name: string
    used: boolean

    set_used(parents?: any[]): void

    create(...args: any[]): T
}
