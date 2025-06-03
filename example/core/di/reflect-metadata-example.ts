import 'reflect-metadata'
import { TpService } from '@tarpit/core'

// Example demonstrating how reflect-metadata works with TypeScript decorators

class DatabaseService {}
interface IUserService {}

@TpService()
class ExampleService {
    constructor(
        private db: DatabaseService,        // Class type
        private config: IUserService,       // Interface type  
        private name: string,               // Primitive type
        private port: number,               // Primitive type
        private enabled: boolean            // Primitive type
    ) {}
}

function main() {
    console.log('=== Reflect Metadata Example ===\n')
    
    // What reflect-metadata returns for constructor parameter types:
    const param_types = Reflect.getMetadata('design:paramtypes', ExampleService)
    console.log('Parameter types:', param_types)
    console.log('Output: [')
    console.log('  [class DatabaseService],')
    console.log('  [Function: Object],')
    console.log('  [Function: String],') 
    console.log('  [Function: Number],')
    console.log('  [Function: Boolean]')
    console.log(']\n')
    
    console.log('Breakdown:')
    console.log('- DatabaseService → [class DatabaseService] (class constructor function)')
    console.log('- IUserService → [Function: Object] (interfaces become Object at runtime)')
    console.log('- string → [Function: String] (primitive type constructor)')
    console.log('- number → [Function: Number] (primitive type constructor)')
    console.log('- boolean → [Function: Boolean] (primitive type constructor)')
}

if (require.main === module) {
    main()
} 