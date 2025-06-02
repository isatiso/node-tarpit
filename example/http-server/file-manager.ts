import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'
import { 
    HttpServerModule, 
    HttpFileManager,
    TpRouter, 
    Get,
    Post,
    Put,
    Delete,
    JsonBody,
    FormBody,
    PathArgs,
    TpRequest, 
    TpResponse,
    TpHttpFinish
} from '@tarpit/http'
import { Jtl } from '@tarpit/judge'
import fs from 'fs'

// Ensure data directory exists
function setup_data_directory() {
    const data_dir = './data'
    if (!fs.existsSync(data_dir)) {
        fs.mkdirSync(data_dir, { recursive: true })
    }
    
    // Create sample files
    const samples = [
        { path: 'welcome.txt', content: 'Welcome to Tarpit File Manager!\nThis is a sample file.' },
        { path: 'config.json', content: JSON.stringify({ name: 'Sample Config', version: '1.0' }, null, 2) },
        { path: 'logs/app.log', content: 'Application log entry\nGenerated at: ' + new Date().toISOString() }
    ]
    
    samples.forEach(sample => {
        const full_path = `${data_dir}/${sample.path}`
        const dir = full_path.substring(0, full_path.lastIndexOf('/'))
        
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        
        if (!fs.existsSync(full_path)) {
            fs.writeFileSync(full_path, sample.content)
        }
    })
    
    console.log('✓ Data directory and sample files created')
}

// File metadata service
@TpService()
class FileMetadataService {
    private metadata = new Map<string, any>()
    
    set_metadata(path: string, metadata: any) {
        this.metadata.set(path, {
            ...metadata,
            updated_at: new Date().toISOString()
        })
    }
    
    get_metadata(path: string) {
        return this.metadata.get(path)
    }
    
    list_metadata() {
        return Array.from(this.metadata.entries()).map(([path, metadata]) => ({
            path,
            ...metadata
        }))
    }
}

// File operations router
@TpRouter('/api/files')
class FileRouter {
    
    constructor(
        private file_manager: HttpFileManager,
        private metadata_service: FileMetadataService
    ) {}
    
    @Get('list')
    async list_files(req: TpRequest) {
        const path = req.query?.get?.('path') || ''
        
        try {
            const files = await this.file_manager.ls(path as string)
            return {
                path: path || '/',
                files: files.map(file => ({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    modified: file.mtime
                }))
            }
        } catch (error) {
            throw new TpHttpFinish({
                status: 404,
                code: 'PATH_NOT_FOUND',
                msg: `Path not found: ${path}`
            })
        }
    }
    
    @Get('read/:filename')
    async read_file(path_args: PathArgs<{ filename: string }>, res: TpResponse) {
        const filename = path_args.ensure('filename', Jtl.string)
        
        try {
            const content = await this.file_manager.read(filename)
            
            // Set appropriate content type
            if (filename.endsWith('.json')) {
                res.set('Content-Type', 'application/json')
            } else if (filename.endsWith('.txt') || filename.endsWith('.log')) {
                res.set('Content-Type', 'text/plain')
            }
            
            return content.toString()
        } catch (error) {
            throw new TpHttpFinish({
                status: 404,
                code: 'FILE_NOT_FOUND',
                msg: `File not found: ${filename}`
            })
        }
    }
    
    @Get('download/:filename')
    async download_file(path_args: PathArgs<{ filename: string }>, res: TpResponse) {
        const filename = path_args.ensure('filename', Jtl.string)
        
        try {
            // Set download headers
            res.set('Content-Disposition', `attachment; filename="${filename}"`)
            res.set('Content-Type', 'application/octet-stream')
            
            const stream = await this.file_manager.read_stream(filename)
            return stream
        } catch (error) {
            throw new TpHttpFinish({
                status: 404,
                code: 'FILE_NOT_FOUND',
                msg: `File not found: ${filename}`
            })
        }
    }
    
    @Post('upload')
    async upload_file(body: FormBody<{ file: File, path?: string }>) {
        const file = body.ensure('file', Jtl.any) // File validation
        const target_path = body.get('path') || file.name
        
        if (!file || !file.name) {
            throw new TpHttpFinish({
                status: 400,
                code: 'INVALID_FILE',
                msg: 'No file provided'
            })
        }
        
        try {
            await this.file_manager.write(target_path as string, file.buffer)
            
            // Store metadata
            this.metadata_service.set_metadata(target_path as string, {
                original_name: file.name,
                mime_type: file.type || 'application/octet-stream',
                uploaded_at: new Date().toISOString()
            })
            
            return {
                message: 'File uploaded successfully',
                path: target_path,
                size: file.size
            }
        } catch (error) {
            throw new TpHttpFinish({
                status: 500,
                code: 'UPLOAD_FAILED',
                msg: `Failed to upload file: ${error}`
            })
        }
    }
    
    @Post('create')
    async create_file(body: JsonBody<{ path: string, content: string }>) {
        const path = body.ensure('path', Jtl.string)
        const content = body.ensure('content', Jtl.string)
        
        try {
            const exists = await this.file_manager.exists(path)
            if (exists) {
                throw new TpHttpFinish({
                    status: 409,
                    code: 'FILE_EXISTS',
                    msg: `File already exists: ${path}`
                })
            }
            
            await this.file_manager.write(path, Buffer.from(content))
            
            this.metadata_service.set_metadata(path, {
                created_via: 'api',
                content_type: 'text/plain'
            })
            
            return {
                message: 'File created successfully',
                path,
                size: content.length
            }
        } catch (error) {
            if (error instanceof TpHttpFinish) throw error
            
            throw new TpHttpFinish({
                status: 500,
                code: 'CREATE_FAILED',
                msg: `Failed to create file: ${error}`
            })
        }
    }
    
    @Put('update/:filename')
    async update_file(path_args: PathArgs<{ filename: string }>, body: JsonBody<{ content: string }>) {
        const filename = path_args.ensure('filename', Jtl.string)
        const content = body.ensure('content', Jtl.string)
        
        try {
            const exists = await this.file_manager.exists(filename)
            if (!exists) {
                throw new TpHttpFinish({
                    status: 404,
                    code: 'FILE_NOT_FOUND',
                    msg: `File not found: ${filename}`
                })
            }
            
            await this.file_manager.write(filename, Buffer.from(content))
            
            this.metadata_service.set_metadata(filename, {
                updated_via: 'api',
                content_type: 'text/plain'
            })
            
            return {
                message: 'File updated successfully',
                path: filename,
                size: content.length
            }
        } catch (error) {
            if (error instanceof TpHttpFinish) throw error
            
            throw new TpHttpFinish({
                status: 500,
                code: 'UPDATE_FAILED',
                msg: `Failed to update file: ${error}`
            })
        }
    }
    
    @Delete('delete/:filename')
    async delete_file(path_args: PathArgs<{ filename: string }>) {
        const filename = path_args.ensure('filename', Jtl.string)
        
        try {
            const exists = await this.file_manager.exists(filename)
            if (!exists) {
                throw new TpHttpFinish({
                    status: 404,
                    code: 'FILE_NOT_FOUND',
                    msg: `File not found: ${filename}`
                })
            }
            
            await this.file_manager.rm(filename)
            
            return {
                message: 'File deleted successfully',
                path: filename
            }
        } catch (error) {
            if (error instanceof TpHttpFinish) throw error
            
            throw new TpHttpFinish({
                status: 500,
                code: 'DELETE_FAILED',
                msg: `Failed to delete file: ${error}`
            })
        }
    }
    
    @Post('copy')
    async copy_file(body: JsonBody<{ source: string, destination: string }>) {
        const source = body.ensure('source', Jtl.string)
        const destination = body.ensure('destination', Jtl.string)
        
        try {
            const exists = await this.file_manager.exists(source)
            if (!exists) {
                throw new TpHttpFinish({
                    status: 404,
                    code: 'SOURCE_NOT_FOUND',
                    msg: `Source file not found: ${source}`
                })
            }
            
            await this.file_manager.cp(source, destination)
            
            return {
                message: 'File copied successfully',
                source,
                destination
            }
        } catch (error) {
            if (error instanceof TpHttpFinish) throw error
            
            throw new TpHttpFinish({
                status: 500,
                code: 'COPY_FAILED',
                msg: `Failed to copy file: ${error}`
            })
        }
    }
    
    @Post('rename')
    async rename_file(body: JsonBody<{ old_path: string, new_path: string }>) {
        const old_path = body.ensure('old_path', Jtl.string)
        const new_path = body.ensure('new_path', Jtl.string)
        
        try {
            const exists = await this.file_manager.exists(old_path)
            if (!exists) {
                throw new TpHttpFinish({
                    status: 404,
                    code: 'FILE_NOT_FOUND',
                    msg: `File not found: ${old_path}`
                })
            }
            
            await this.file_manager.rename(old_path, new_path)
            
            return {
                message: 'File renamed successfully',
                old_path,
                new_path
            }
        } catch (error) {
            if (error instanceof TpHttpFinish) throw error
            
            throw new TpHttpFinish({
                status: 500,
                code: 'RENAME_FAILED',
                msg: `Failed to rename file: ${error}`
            })
        }
    }
}

// Directory operations router
@TpRouter('/api/directories')
class DirectoryRouter {
    
    constructor(private file_manager: HttpFileManager) {}
    
    @Post('create')
    async create_directory(body: JsonBody<{ path: string }>) {
        const path = body.ensure('path', Jtl.string)
        
        try {
            await this.file_manager.mkdir(path)
            
            return {
                message: 'Directory created successfully',
                path
            }
        } catch (error) {
            throw new TpHttpFinish({
                status: 500,
                code: 'MKDIR_FAILED',
                msg: `Failed to create directory: ${error}`
            })
        }
    }
    
    @Get('archive/:dirname')
    async archive_directory(path_args: PathArgs<{ dirname: string }>, res: TpResponse) {
        const dirname = path_args.ensure('dirname', Jtl.string)
        
        try {
            const exists = await this.file_manager.exists(dirname)
            if (!exists) {
                throw new TpHttpFinish({
                    status: 404,
                    code: 'DIRECTORY_NOT_FOUND',
                    msg: `Directory not found: ${dirname}`
                })
            }
            
            // Set archive download headers
            res.set('Content-Disposition', `attachment; filename="${dirname}.tar.gz"`)
            res.set('Content-Type', 'application/gzip')
            
            const archive_stream = await this.file_manager.zip(dirname)
            return archive_stream
        } catch (error) {
            if (error instanceof TpHttpFinish) throw error
            
            throw new TpHttpFinish({
                status: 500,
                code: 'ARCHIVE_FAILED',
                msg: `Failed to archive directory: ${error}`
            })
        }
    }
}

// Metadata router
@TpRouter('/api/metadata')
class MetadataRouter {
    
    constructor(private metadata_service: FileMetadataService) {}
    
    @Get('list')
    async list_metadata() {
        return {
            metadata: this.metadata_service.list_metadata()
        }
    }
    
    @Get(':filename')
    async get_metadata(path_args: PathArgs<{ filename: string }>) {
        const filename = path_args.ensure('filename', Jtl.string)
        const metadata = this.metadata_service.get_metadata(filename)
        
        if (!metadata) {
            throw new TpHttpFinish({
                status: 404,
                code: 'METADATA_NOT_FOUND',
                msg: `No metadata found for: ${filename}`
            })
        }
        
        return { path: filename, ...metadata }
    }
}

async function main() {
    console.log('=== File Manager Example ===\n')
    
    // Setup data directory
    setup_data_directory()
    
    const config = load_config<TpConfigSchema>({ 
        http: {
            port: 4206,
            file_manager: {
                root: './data',
                download_limit: 100 * 1024 * 1024 // 100MB
            }
        }
    })
    
    const platform = new Platform(config)
        .import(HttpServerModule)
        .import(FileMetadataService)
        .import(FileRouter)
        .import(DirectoryRouter)
        .import(MetadataRouter)
    
    await platform.start()
    
    console.log('HTTP Server started on http://localhost:4206')
    console.log('\n=== File Operations ===')
    
    console.log('\nFile Management:')
    console.log('  GET    /api/files/list          - List files (?path=subdirectory)')
    console.log('  GET    /api/files/read/:filename - Read file content')
    console.log('  GET    /api/files/download/:filename - Download file')
    console.log('  POST   /api/files/upload        - Upload file (multipart/form-data)')
    console.log('  POST   /api/files/create        - Create file with content')
    console.log('  PUT    /api/files/update/:filename - Update file content')
    console.log('  DELETE /api/files/delete/:filename - Delete file')
    console.log('  POST   /api/files/copy          - Copy file')
    console.log('  POST   /api/files/rename        - Rename/move file')
    
    console.log('\nDirectory Operations:')
    console.log('  POST   /api/directories/create  - Create directory')
    console.log('  GET    /api/directories/archive/:dirname - Download directory as tar.gz')
    
    console.log('\nMetadata:')
    console.log('  GET    /api/metadata/list       - List all file metadata')
    console.log('  GET    /api/metadata/:filename  - Get file metadata')
    
    console.log('\n=== Test Commands ===')
    
    console.log('\n# List files')
    console.log('curl http://localhost:4206/api/files/list')
    console.log('curl "http://localhost:4206/api/files/list?path=logs"')
    
    console.log('\n# Read file content')
    console.log('curl http://localhost:4206/api/files/read/welcome.txt')
    console.log('curl http://localhost:4206/api/files/read/config.json')
    
    console.log('\n# Create new file')
    console.log('curl -X POST http://localhost:4206/api/files/create \\')
    console.log('  -H "Content-Type: application/json" \\')
    console.log('  -d \'{"path":"test.txt","content":"Hello from API!"}\'')
    
    console.log('\n# Upload file')
    console.log('curl -X POST http://localhost:4206/api/files/upload \\')
    console.log('  -F "file=@/path/to/your/file.txt"')
    
    console.log('\n# Copy file')
    console.log('curl -X POST http://localhost:4206/api/files/copy \\')
    console.log('  -H "Content-Type: application/json" \\')
    console.log('  -d \'{"source":"welcome.txt","destination":"welcome-copy.txt"}\'')
    
    console.log('\n# Download file')
    console.log('curl -O http://localhost:4206/api/files/download/welcome.txt')
    
    console.log('\n# Create directory and archive')
    console.log('curl -X POST http://localhost:4206/api/directories/create \\')
    console.log('  -H "Content-Type: application/json" \\')
    console.log('  -d \'{"path":"test-dir"}\'')
    console.log('curl -O http://localhost:4206/api/directories/archive/logs')
    
    console.log('\n# Get metadata')
    console.log('curl http://localhost:4206/api/metadata/list')
    
    console.log('\nPress Ctrl+C to stop the server')
}

if (require.main === module) {
    main().catch(console.error)
} 