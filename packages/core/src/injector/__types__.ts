export interface TpEventCollector {
    'tp-destroy': true
}

export type TpEvent = keyof TpEventCollector
