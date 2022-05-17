export const WEEKDAY_NAME = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_')

export interface DateFields {
    year: number
    month: number
    date: number
    weekday: number
    hour: number
    minute: number
    second: number
    millisecond: number
}

const date_time_format_config = {
    weekday: 'short',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    fractionalSecondDigits: 3,
    hourCycle: 'h23',
    timeZoneName: 'short'
}

export function parse_date_field(date: Date, timezone: string): DateFields {
    const res: DateFields = {} as any
    const format_config = { ...date_time_format_config, timeZone: timezone }
    new Intl.DateTimeFormat('en-US', format_config as any).formatToParts(date)
        .forEach(item => {
            switch (item.type) {
                case 'year':
                    res.year = +item.value
                    break
                case 'month':
                    res.month = +item.value - 1
                    break
                case 'day':
                    res.date = +item.value
                    break
                case 'weekday':
                    res.weekday = Math.floor(WEEKDAY_NAME.indexOf(item.value))
                    break
                case 'hour':
                    res.hour = +item.value
                    break
                case 'minute':
                    res.minute = +item.value
                    break
                case 'second':
                    res.second = +item.value
                    break
                case 'fractionalSecond' as any:
                    res.millisecond = +item.value
                    break
            }
        })

    return res
}
