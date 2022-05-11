export interface CliOptions {
    cover?: {
        /**
         * 是否在测试结束后清除所有缓存文件
         * @TJS-examples [false]
         */
        clean?: boolean
        /**
         * 设置 reporter，默认为 text
         * @TJS-examples ["text"]
         */
        reporter?:
            | 'text'
            | 'clover'
            | 'cobertura'
            | 'html'
            | 'json-summary'
            | 'json'
            | 'lcov'
            | 'lcovonly'
            | 'none'
            | 'teamcity'
            | 'text-lcov'
            | 'text-summary'
    }
}
