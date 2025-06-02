import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema } from '@tarpit/core'
import { 
    HttpServerModule, 
    HttpStatic,
    TpRouter, 
    Get,
    TpRequest, 
    TpResponse,
    TpHttpFinish
} from '@tarpit/http'
import fs from 'fs'
import path from 'path'

// Ensure static directories exist and create sample files
function setup_static_directories() {
    const directories = ['./public', './assets', './docs']
    
    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
    })
    
    // Create sample files
    if (!fs.existsSync('./public/index.html')) {
        fs.writeFileSync('./public/index.html', `
<!DOCTYPE html>
<html>
<head>
    <title>Tarpit Static Files Demo</title>
    <link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
    <h1>Static Files Example</h1>
    <p>This is served from ./public/index.html</p>
    <ul>
        <li><a href="/assets/sample.txt">View Sample Text</a></li>
        <li><a href="/docs/README.md">View Documentation</a></li>
        <li><a href="/api/static/info">Static Service Info</a></li>
    </ul>
    <script src="/assets/app.js"></script>
</body>
</html>`)
    }
    
    if (!fs.existsSync('./assets/styles.css')) {
        fs.writeFileSync('./assets/styles.css', `
body {
    font-family: Arial, sans-serif;
    max-width: 800px;
    margin: 50px auto;
    padding: 20px;
    background-color: #f5f5f5;
}

h1 {
    color: #333;
    border-bottom: 2px solid #007bff;
    padding-bottom: 10px;
}

ul {
    list-style-type: none;
    padding: 0;
}

li {
    margin: 10px 0;
}

a {
    color: #007bff;
    text-decoration: none;
    padding: 5px 10px;
    border: 1px solid #007bff;
    border-radius: 3px;
    display: inline-block;
}

a:hover {
    background-color: #007bff;
    color: white;
}`)
    }
    
    if (!fs.existsSync('./assets/app.js')) {
        fs.writeFileSync('./assets/app.js', `
console.log('Static JavaScript file loaded from ./assets/app.js');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, adding interactivity...');
    
    // Add click handler to all links
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', function() {
            console.log('Link clicked:', this.href);
        });
    });
});`)
    }
    
    if (!fs.existsSync('./assets/sample.txt')) {
        fs.writeFileSync('./assets/sample.txt', 
            'This is a sample text file served from ./assets/sample.txt\n' +
            'Generated at: ' + new Date().toISOString() + '\n\n' +
            'You can access this file at: http://localhost:4205/assets/sample.txt'
        )
    }
    
    if (!fs.existsSync('./docs/README.md')) {
        fs.writeFileSync('./docs/README.md', `# Documentation

This is a sample markdown file served from ./docs/README.md

## Static File Service

The Tarpit HTTP static file service provides:

- Automatic ETag generation
- Cache control headers
- Directory traversal protection
- Multiple static directories
- File extension handling

## Configuration

Static files are configured in the platform setup:

\`\`\`typescript
static: [
    { scope: '', root: './public' },
    { scope: 'assets', root: './assets' },
    { scope: 'docs', root: './docs' }
]
\`\`\`

Generated at: ${new Date().toISOString()}`)
    }
    
    console.log('✓ Static directories and sample files created')
}

// Custom static router for demonstration
@TpRouter('/api/static')
class StaticApiRouter {
    
    constructor(private static_service: HttpStatic) {}
    
    @Get('info')
    async static_info() {
        return {
            message: 'Static file service information',
            endpoints: {
                'GET /': 'Serves ./public/index.html',
                'GET /assets/*': 'Serves files from ./assets/',
                'GET /docs/*': 'Serves files from ./docs/',
                'GET /api/static/serve/:scope/*': 'Custom static serving'
            },
            features: [
                'Automatic ETag generation',
                'Cache control headers',
                'Directory traversal protection',
                'Multiple static directories'
            ]
        }
    }
    
    @Get('serve/:scope/*')
    async custom_serve(req: TpRequest, res: TpResponse) {
        // Extract scope from path
        const path_parts = req.path?.split('/') || []
        const scope = path_parts[4] // /api/static/serve/:scope
        const file_path = path_parts.slice(5).join('/') // remaining path
        
        if (!scope || !file_path) {
            throw new TpHttpFinish({
                status: 400,
                code: 'INVALID_PATH',
                msg: 'Invalid path format. Use /api/static/serve/:scope/path/to/file'
            })
        }
        
        try {
            // Create a custom request for the static service
            const static_req = { 
                ...req, 
                path: file_path 
            } as TpRequest
            
            const stream = await this.static_service.serve(static_req, res, {
                scope,
                cache_control: { public: true, 'max-age': 1800 }
            })
            
            // Add custom header
            res.set('X-Served-By', 'Custom Static API')
            
            return stream
        } catch (error) {
            throw new TpHttpFinish({
                status: 404,
                code: 'FILE_NOT_FOUND',
                msg: `File not found in scope '${scope}': ${file_path}`
            })
        }
    }
}

// Router for conditional static serving
@TpRouter('/conditional')
class ConditionalStaticRouter {
    
    constructor(private static_service: HttpStatic) {}
    
    @Get('*')
    async conditional_serve(req: TpRequest, res: TpResponse) {
        const user_agent = req.headers?.get?.('user-agent') || ''
        const is_mobile = /Mobile|Android|iPhone/.test(user_agent)
        
        // Set vary header for proper caching
        res.set('Vary', 'User-Agent')
        
        try {
            // Try to serve mobile or desktop version
            const scope = is_mobile ? 'mobile' : 'desktop'
            
            const stream = await this.static_service.serve(req, res, {
                scope,
                cache_control: { public: true, 'max-age': 3600 }
            })
            
            res.set('X-Device-Type', is_mobile ? 'mobile' : 'desktop')
            return stream
            
        } catch (error) {
            // Fallback to default public files
            try {
                const stream = await this.static_service.serve(req, res, {
                    scope: '',
                    cache_control: { public: true, 'max-age': 300 }
                })
                res.set('X-Fallback', 'true')
                return stream
            } catch (fallback_error) {
                throw new TpHttpFinish({
                    status: 404,
                    code: 'FILE_NOT_FOUND',
                    msg: 'File not found in any scope'
                })
            }
        }
    }
}

async function main() {
    console.log('=== Static Files Example ===\n')
    
    // Setup directories and sample files
    setup_static_directories()
    
    const config = load_config<TpConfigSchema>({ 
        http: {
            port: 4205,
            static: [
                {
                    scope: '',              // Root scope
                    root: './public',
                    index: ['index.html'],
                    cache_control: { public: true, 'max-age': 300 }
                },
                {
                    scope: 'assets',        // Assets scope
                    root: './assets',
                    cache_control: { public: true, 'max-age': 86400 },
                    vary: ['Accept-Encoding']
                },
                {
                    scope: 'docs',          // Docs scope
                    root: './docs',
                    index: ['README.md', 'index.html'],
                    extensions: ['.md', '.html'],
                    cache_control: { public: true, 'max-age': 1800 }
                },
                {
                    scope: 'secure',        // Secure files (example)
                    root: './public',
                    dotfile: 'deny',
                    cache_control: { private: true, 'no-cache': true }
                }
            ]
        }
    })
    
    const platform = new Platform(config)
        .import(HttpServerModule)
        .import(StaticApiRouter)
        .import(ConditionalStaticRouter)
    
    await platform.start()
    
    console.log('HTTP Server started on http://localhost:4205')
    console.log('\n=== Static File Endpoints ===')
    
    console.log('\nAutomatic Static Serving:')
    console.log('  GET    /                        - Serves ./public/index.html')
    console.log('  GET    /assets/styles.css       - Serves ./assets/styles.css')
    console.log('  GET    /assets/app.js           - Serves ./assets/app.js')
    console.log('  GET    /assets/sample.txt       - Serves ./assets/sample.txt')
    console.log('  GET    /docs/README.md          - Serves ./docs/README.md')
    
    console.log('\nAPI Endpoints:')
    console.log('  GET    /api/static/info         - Static service information')
    console.log('  GET    /api/static/serve/:scope/* - Custom static serving')
    
    console.log('\nConditional Serving:')
    console.log('  GET    /conditional/*           - Device-based file serving')
    
    console.log('\n=== Test Commands ===')
    
    console.log('\n# Test static files')
    console.log('curl http://localhost:4205/')
    console.log('curl http://localhost:4205/assets/styles.css')
    console.log('curl http://localhost:4205/docs/README.md')
    
    console.log('\n# Test API endpoints')
    console.log('curl http://localhost:4205/api/static/info')
    console.log('curl http://localhost:4205/api/static/serve/assets/sample.txt')
    
    console.log('\n# Test conditional serving (with different User-Agent)')
    console.log('curl -H "User-Agent: Mobile" http://localhost:4205/conditional/index.html')
    console.log('curl -H "User-Agent: Desktop" http://localhost:4205/conditional/index.html')
    
    console.log('\n# Test headers')
    console.log('curl -I http://localhost:4205/assets/styles.css')
    console.log('curl -I http://localhost:4205/docs/README.md')
    
    console.log('\n=== Browser Test ===')
    console.log('Open http://localhost:4205 in your browser to see the interactive demo')
    
    console.log('\nPress Ctrl+C to stop the server')
}

if (require.main === module) {
    main().catch(console.error)
} 