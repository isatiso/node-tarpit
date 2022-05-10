import { DI_TOKEN, MetaTools, MetaWrapper, TokenTools } from '@tarpit/core'
import { RouterFunction } from '../__types__'

export * from './gunslinger'

export const get_router_function = MetaWrapper<RouterFunction<any>>(
    DI_TOKEN.property_function,
    'property_only',
    <T extends (...args: any) => any>(prototype: any, property?: string): RouterFunction<T> => {

        const [descriptor, prop] = MetaTools.check_property(prototype, property)
        const parameter_injection = MetaTools.PropertyMeta(prototype, prop).value?.parameter_injection
        const router_function: RouterFunction<T> = {
            type: 'TpRouterFunction',
            prototype,
            path: prop,
            descriptor: descriptor,
            handler: descriptor.value,
            property: prop,
            param_types: MetaTools.get_method_parameter_types(prototype, prop)?.map((t: any, i: number) => parameter_injection?.[i] ?? t) as Parameters<T>,
            auth: false,
            wrap_result: true,
        }
        TokenTools.FunctionRecord(prototype).ensure_default().do(touched => {
            touched[prop] = router_function
        })
        return router_function
    })
