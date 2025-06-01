import { Platform, TpConfigSchema } from '@tarpit/core'
import { load_config } from '@tarpit/config'
import { 
    ContentTypeModule, 
    ContentReaderService,
    URLEncoding,
    json_deserialize,
    form_deserialize,
    text_deserialize,
    MIMEContent
} from '@tarpit/content-type'

async function demo_json_processing(content_reader: ContentReaderService) {
    console.log('\n📄 === JSON Content Processing Demo ===')
    
    const json_data = {
        user_id: 12345,
        name: '张三',
        email: 'zhangsan@example.com',
        preferences: { language: 'zh-CN', theme: 'dark' },
        tags: ['developer', 'typescript', 'nodejs']
    }
    
    const json_buffer = Buffer.from(JSON.stringify(json_data, null, 2))
    
    console.log('🔹 Processing JSON buffer...')
    const content = await content_reader.read(json_buffer, {
        content_type: 'application/json; charset=utf-8',
        content_encoding: 'identity'
    })
    
    console.log('✅ JSON processed successfully:')
    console.log('  Content type:', content.type)
    console.log('  Charset:', content.charset)
    console.log('  Original size:', json_buffer.length, 'bytes')
    console.log('  Parsed data:', JSON.stringify(content.data, null, 2))
    
    return content.data
}

async function demo_form_processing(content_reader: ContentReaderService) {
    console.log('\n📝 === Form Data Processing Demo ===')
    
    const form_data = URLEncoding.stringify({
        username: 'test_user',
        password: 'secret123!@#',
        email: 'user@example.com',
        interests: ['coding', 'reading', 'gaming'],
        bio: 'Hello, 世界! This is a test bio.',
        age: '25'
    })
    
    console.log('🔹 Form data string:', form_data)
    
    const form_buffer = Buffer.from(form_data)
    const content = await content_reader.read(form_buffer, {
        content_type: 'application/x-www-form-urlencoded',
        content_encoding: 'identity'
    })
    
    console.log('✅ Form processed successfully:')
    console.log('  Content type:', content.type)
    console.log('  Parsed fields:')
    
    Object.entries(content.data || {}).forEach(([key, value]) => {
        console.log(`    ${key}:`, value)
    })
    
    return content.data
}

async function demo_text_processing(content_reader: ContentReaderService) {
    console.log('\n📃 === Text Content Processing Demo ===')
    
    const text_content = `Welcome to Tarpit Framework!

This is a multi-line text example demonstrating:
- Text content processing  
- Character encoding handling (UTF-8)
- Line counting and analysis

支持中文字符处理
Supports Unicode: 🚀 🎉 ✨

Special characters: @#$%^&*()`
    
    const text_buffer = Buffer.from(text_content, 'utf-8')
    
    const content = await content_reader.read(text_buffer, {
        content_type: 'text/plain; charset=utf-8',
        content_encoding: 'identity'
    })
    
    console.log('✅ Text processed successfully:')
    console.log('  Content type:', content.type)
    console.log('  Charset:', content.charset)
    console.log('  Text length:', content.text?.length)
    
    const lines = content.text?.split('\n') || []
    console.log('  Line count:', lines.length)
    console.log('  Non-empty lines:', lines.filter(line => line.trim()).length)
    
    return content.text
}

async function demo_error_handling(content_reader: ContentReaderService) {
    console.log('\n❌ === Error Handling Demo ===')
    
    // Test with invalid JSON
    console.log('🔹 Testing invalid JSON handling...')
    const invalid_json = Buffer.from('{"invalid": json, "missing": quote}')
    
    const json_content = await content_reader.read(invalid_json, {
        content_type: 'application/json',
        content_encoding: 'identity'
    })
    
    console.log('  Invalid JSON result:')
    console.log('    Parsed data:', json_content.data)
    console.log('    Raw text available:', !!json_content.text)
    console.log('    Raw text:', json_content.text?.substring(0, 50) + '...')
    
    // Test with binary content (no deserializer)
    console.log('\n🔹 Testing binary content (no deserializer)...')
    const binary_data = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])
    
    const binary_content = await content_reader.read(binary_data, {
        content_type: 'image/png',
        content_encoding: 'identity'
    })
    
    console.log('  Binary content result:')
    console.log('    Content type:', binary_content.type)
    console.log('    Has text:', !!binary_content.text)
    console.log('    Has parsed data:', !!binary_content.data)
    console.log('    Raw buffer size:', binary_content.raw.length, 'bytes')
}

function demo_url_encoding() {
    console.log('\n🔗 === URL Encoding Utilities Demo ===')
    
    const test_cases = [
        'name=John&age=30',
        'tags=js&tags=ts&tags=node',
        'search=%E6%90%9C%E7%B4%A2&category=tech',
        'complex=hello%20world&special=%21%40%23%24%25',
        'empty_value=&null_value'
    ]
    
    console.log('🔹 Parsing query strings:')
    test_cases.forEach((query, index) => {
        const parsed = URLEncoding.parse(query)
        console.log(`  ${index + 1}. "${query}"`)
        console.log('     →', JSON.stringify(parsed))
    })
    
    console.log('\n🔹 Stringifying objects:')
    const test_objects = [
        { name: 'John', age: '30' },
        { tags: ['js', 'ts', 'node'] },
        { search: '搜索', category: 'tech' },
        { special: '!@#$%', normal: 'value' }
    ]
    
    test_objects.forEach((obj, index) => {
        const stringified = URLEncoding.stringify(obj)
        console.log(`  ${index + 1}.`, JSON.stringify(obj))
        console.log('     →', stringified)
    })
}

function demo_deserializers() {
    console.log('\n🧪 === Direct Deserializer Testing ===')
    
    // JSON deserializer tests
    console.log('🔹 JSON Deserializer:')
    const json_test_cases = [
        '{"valid": "json"}',
        '{"invalid": json}',
        'null',
        '[]',
        '""'
    ]
    
    json_test_cases.forEach((json_str, index) => {
        const content: MIMEContent<any> = {
            type: 'application/json',
            charset: 'utf-8',
            parameters: {},
            raw: Buffer.from(json_str)
        }
        
        const result = json_deserialize(content)
        console.log(`  Test ${index + 1}: "${json_str}" → `, result)
    })
    
    // Form deserializer tests
    console.log('\n🔹 Form Deserializer:')
    const form_test_cases = [
        'name=John&age=30',
        'tags=a&tags=b&tags=c',
        'encoded=%E4%B8%AD%E6%96%87&special=%21%40%23'
    ]
    
    form_test_cases.forEach((form_str, index) => {
        const content: MIMEContent<any> = {
            type: 'application/x-www-form-urlencoded',
            charset: 'utf-8',
            parameters: {},
            raw: Buffer.from(form_str)
        }
        
        const result = form_deserialize(content)
        console.log(`  Test ${index + 1}: "${form_str}" → `, result)
    })
    
    // Text deserializer tests
    console.log('\n🔹 Text Deserializer:')
    const text_test_cases = [
        'Simple text',
        '中文文本测试',
        'Multi\nline\ntext'
    ]
    
    text_test_cases.forEach((text_str, index) => {
        const content: MIMEContent<any> = {
            type: 'text/plain',
            charset: 'utf-8',
            parameters: {},
            raw: Buffer.from(text_str, 'utf-8')
        }
        
        text_deserialize(content)
        console.log(`  Test ${index + 1}: "${text_str}" → length: ${content.text?.length}`)
    })
}

async function main() {
    console.log('=== Tarpit Content Type Module Demo ===\n')
    
    const config = load_config<TpConfigSchema>({})
    
    const platform = new Platform(config).import(ContentTypeModule)
    
    try {
        console.log('🔧 Building platform...')
        await platform.start()
        console.log('✅ Platform started successfully')
        
        const content_reader = platform.expose(ContentReaderService)!
        
        // Run all demos
        await demo_json_processing(content_reader)
        await demo_form_processing(content_reader)
        await demo_text_processing(content_reader)
        await demo_error_handling(content_reader)
        demo_url_encoding()
        demo_deserializers()
        
        console.log('\n🎉 All demos completed successfully!')
        
    } catch (error) {
        console.error('❌ Demo failed:', error)
        if (error instanceof Error && error.stack) {
            console.error('Stack trace:', error.stack)
        }
    } finally {
        console.log('\n🛑 Stopping platform...')
        await platform.terminate()
        console.log('✅ Platform stopped cleanly')
        process.exit(0)
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('💥 Unhandled error:', error)
        process.exit(1)
    })
} 