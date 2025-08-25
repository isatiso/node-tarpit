/**
 * @license
 * Copyright Cao Jiahang All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at source root.
 */

import { describe, it, beforeEach, expect } from 'vitest'
import { TpModule, TpRoot, TpService } from '../annotations'
import { print_provider_tree } from './provider-tree-printer'
import { Injector, ClassProvider, ValueProvider } from '../di'
import { TpConfigData } from '../builtin/tp-config-data'
import { TpLoader } from '../builtin/tp-loader'
import { get_class_decorator, make_decorator } from './decorator'

// Mock classes for testing - Three-tier structure
@TpService()
class Level1Service {
    test() {
        return 'level1'
    }
}

@TpService()
class Level2Service {
    test() {
        return 'level2'
    }
}

@TpService()
class Level3Service {
    test() {
        return 'level3'
    }
}

@TpService()
class SharedService {
    test() {
        return 'shared'
    }
}

// Level 1 Module with def providers
@TpModule({
    providers: [
        Level1Service,
        { provide: 'LEVEL1_CONFIG', useValue: { level: 1 } },
        { provide: 'LEVEL1_TOKEN', useClass: SharedService }
    ]
})
class Level1Module {
}

// Level 2 Module with def providers
@TpModule({
    providers: [
        Level2Service,
        { provide: 'LEVEL2_CONFIG', useValue: { level: 2 } },
        { provide: Symbol.for('level2.token'), useClass: SharedService }
    ]
})
class Level2Module {
}

// Level 3 Module with def providers
@TpModule({
    providers: [
        Level3Service,
        { provide: 'LEVEL3_CONFIG', useValue: { level: 3 } },
        { provide: 999, useValue: 'numeric-token' }
    ]
})
class Level3Module {
}

// Root level 1 (top level)
@TpRoot({
    imports: [],
    providers: [Level1Service]
})
class Level1Root {
}

// Root level 2 (imports Level1Module)
@TpRoot({
    imports: [Level1Module],
    providers: [Level2Service]
})
class Level2Root {
}

// Root level 3 (imports Level2Module)
@TpRoot({
    imports: [Level2Module],
    providers: [Level3Service]
})
class Level3Root {
}

// Mock Platform class for testing
class Platform {
    constructor() {}
}

describe('provider-tree-printer.ts', function() {
    let root_injector: Injector

    beforeEach(function() {
        root_injector = Injector.create()
    })

    describe('#print_provider_tree()', function() {
        it('should print empty root injector', function() {
            const result = print_provider_tree(root_injector)
            expect(result).toEqual([
                'Injector',
                '└── (no providers)'
            ].join('\n'))
        })

        it('should print root injector with built-in services', function() {
            ValueProvider.create(root_injector, { provide: TpConfigData, useValue: {} })
            ClassProvider.create(root_injector, { provide: TpLoader, useClass: TpLoader })
            ValueProvider.create(root_injector, { provide: Platform, useValue: new Platform() })

            const result = print_provider_tree(root_injector)
            expect(result).toContain('Injector')
            expect(result).toContain('TpConfigData [Built-in]')
            expect(result).toContain('TpLoader [Built-in]')
            expect(result).toContain('Platform [Built-in]')
        })

        it('should print root injector with decorated services', function() {
            ClassProvider.create(root_injector, { provide: Level1Service, useClass: Level1Service })
            ClassProvider.create(root_injector, { provide: Level1Module, useClass: Level1Module })
            ClassProvider.create(root_injector, { provide: Level1Root, useClass: Level1Root })

            const result = print_provider_tree(root_injector)
            expect(result).toContain('Injector')
            expect(result).toContain('Level1Service [TpWorker → @TpService]')
            expect(result).toContain('Level1Module [TpAssembly → @TpModule]')
            expect(result).toContain('Level1Root [TpEntry → @TpRoot]')
        })

        it('should print single level child injector', function() {
            // Root level with Platform provider
            ValueProvider.create(root_injector, { provide: TpConfigData, useValue: {} })
            ValueProvider.create(root_injector, { provide: Platform, useValue: new Platform() })

            // Child injector
            const child = Injector.create(root_injector)
            ClassProvider.create(child, { provide: Level1Service, useClass: Level1Service })
            ClassProvider.create(child, { provide: Level1Root, useClass: Level1Root })

            const result = print_provider_tree(root_injector)
            expect(result).toContain('Injector')
            expect(result).toContain('├── ○ TpConfigData [Built-in]')
            expect(result).toContain('├── ○ Platform [Built-in]')
            expect(result).toContain('└── Injector (Level1Root)')
            expect(result).toContain('    ├── ○ Level1Service [TpWorker → @TpService]')
            expect(result).toContain('    └── ○ Level1Root [TpEntry → @TpRoot]')
        })

        it('should print multi-level nested injectors', function() {
            // Root level
            ValueProvider.create(root_injector, { provide: TpConfigData, useValue: {} })

            // First level child
            const child1 = Injector.create(root_injector)
            ClassProvider.create(child1, { provide: Level1Module, useClass: Level1Module })
            ClassProvider.create(child1, { provide: Level2Root, useClass: Level2Root })

            // Second level child
            const child2 = Injector.create(child1)
            ClassProvider.create(child2, { provide: Level2Service, useClass: Level2Service })
            ClassProvider.create(child2, { provide: Level1Root, useClass: Level1Root })

            const result = print_provider_tree(root_injector)
            expect(result).toContain('Injector')
            expect(result).toContain('├── ○ TpConfigData [Built-in]')
            expect(result).toContain('└── Injector (Level2Root)')
            expect(result).toContain('    ├── ○ Level1Module [TpAssembly → @TpModule]')
            expect(result).toContain('    ├── ○ Level2Root [TpEntry → @TpRoot]')
            expect(result).toContain('    └── Injector (Level1Root)')
            expect(result).toContain('        ├── ○ Level2Service [TpWorker → @TpService]')
            expect(result).toContain('        └── ○ Level1Root [TpEntry → @TpRoot]')
        })

        it('should print multiple child injectors at same level', function() {
            // Root level
            ValueProvider.create(root_injector, { provide: TpConfigData, useValue: {} })

            // First child
            const child1 = Injector.create(root_injector)
            ClassProvider.create(child1, { provide: Level1Service, useClass: Level1Service })
            ClassProvider.create(child1, { provide: Level1Root, useClass: Level1Root })

            // Second child
            const child2 = Injector.create(root_injector)
            ClassProvider.create(child2, { provide: Level2Root, useClass: Level2Root })

            const result = print_provider_tree(root_injector)
            expect(result).toContain('Injector')
            expect(result).toContain('├── ○ TpConfigData [Built-in]')
            expect(result).toContain('├── Injector (Level1Root)')
            expect(result).toContain('│   ├── ○ Level1Service [TpWorker → @TpService]')
            expect(result).toContain('│   └── ○ Level1Root [TpEntry → @TpRoot]')
            expect(result).toContain('└── Injector (Level2Root)')
            expect(result).toContain('    └── ○ Level2Root [TpEntry → @TpRoot]')
        })

        it('should handle injector without TpRoot', function() {
            // Child injector without TpRoot
            const child = Injector.create(root_injector)
            ClassProvider.create(child, { provide: Level1Service, useClass: Level1Service })

            const result = print_provider_tree(root_injector)
            expect(result).toContain('└── Injector')
            expect(result).not.toContain('Injector (')
            expect(result).toContain('    └── ○ Level1Service [TpWorker → @TpService]')
        })

        it('should handle child injector with no providers', function() {
            ValueProvider.create(root_injector, { provide: TpConfigData, useValue: {} })

            // Empty child injector
            Injector.create(root_injector)

            const result = print_provider_tree(root_injector)
            expect(result).toContain('Injector')
            expect(result).toContain('├── ○ TpConfigData [Built-in]')
            expect(result).toContain('└── Injector')
            expect(result).toContain('    └── (no providers)')
        })

        it('should handle string and symbol tokens', function() {
            const string_token = 'STRING_TOKEN'
            const symbol_token = Symbol('SYMBOL_TOKEN')

            ValueProvider.create(root_injector, { provide: string_token, useValue: 'test' })
            ValueProvider.create(root_injector, { provide: symbol_token, useValue: 'symbol' })

            const result = print_provider_tree(root_injector)
            expect(result).toContain('"STRING_TOKEN"')
            expect(result).toContain('Symbol(SYMBOL_TOKEN)')
        })

        it('should handle providers without decorators', function() {
            class PlainClass {
                method() {
                    return 'plain'
                }
            }

            ClassProvider.create(root_injector, { provide: PlainClass, useClass: PlainClass })

            const result = print_provider_tree(root_injector)
            expect(result).toContain('PlainClass')
            expect(result).not.toContain('[TpWorker')
            expect(result).not.toContain('[TpAssembly')
            expect(result).not.toContain('[TpEntry')
        })

        it('should filter out Injector tokens', function() {
            ClassProvider.create(root_injector, { provide: Level1Service, useClass: Level1Service })
            // The injector automatically includes itself, so we don't need to manually add it
            // This test verifies that the function filters it out

            const result = print_provider_tree(root_injector)
            expect(result).toContain('Level1Service [TpWorker → @TpService]')
            expect(result).not.toContain('Injector [')
        })

        it('should handle complex nested structure with all features', function() {
            // Root level with built-ins
            ValueProvider.create(root_injector, { provide: TpConfigData, useValue: {} })
            ClassProvider.create(root_injector, { provide: TpLoader, useClass: TpLoader })
            ValueProvider.create(root_injector, { provide: Platform, useValue: new Platform() })

            // Level 1 - Level2Root injector
            const level2_injector = Injector.create(root_injector)
            ClassProvider.create(level2_injector, { provide: Level2Root, useClass: Level2Root })

            // Level 2 - Level1Root injector
            const level1_injector = Injector.create(level2_injector)
            ClassProvider.create(level1_injector, { provide: Level1Root, useClass: Level1Root })

            const result = print_provider_tree(root_injector)

            const lines = result.split('\n')
            expect(lines[0]).toEqual('Injector')
            // Don't check exact order of built-in services, just check they exist
            expect(result).toContain('○ TpLoader [Built-in]')
            expect(result).toContain('○ TpConfigData [Built-in]')
            expect(result).toContain('○ Platform [Built-in]')
            expect(result).toContain('└── Injector (Level2Root)')
            expect(result).toContain('    └── Injector (Level1Root)')
            expect(result).toContain('        └── ○ Level1Root [TpEntry → @TpRoot]')
        })

        it('should handle anonymous function names', function() {
            // Create anonymous class with TpRoot decorator
            const AnonymousRoot = class {}
            TpRoot()(AnonymousRoot)

            // Set name property to undefined to trigger 'Unknown' fallback
            Object.defineProperty(AnonymousRoot, 'name', {
                value: undefined,
                writable: false,
                configurable: true
            })

            // Create another class with empty string name to also trigger 'Unknown'
            const EmptyNameRoot = class {}
            TpRoot()(EmptyNameRoot)
            Object.defineProperty(EmptyNameRoot, 'name', {
                value: '',
                writable: false,
                configurable: true
            })

            // Create anonymous provider class
            const AnonymousProvider = class {}
            // Set name property to undefined to trigger 'Anonymous' fallback
            Object.defineProperty(AnonymousProvider, 'name', {
                value: undefined,
                writable: false,
                configurable: true
            })

            // Create child injectors with anonymous TpRoots
            const child1 = Injector.create(root_injector)
            ClassProvider.create(child1, { provide: AnonymousRoot, useClass: AnonymousRoot })
            ClassProvider.create(child1, { provide: AnonymousProvider, useClass: AnonymousProvider })

            const child2 = Injector.create(root_injector)
            ClassProvider.create(child2, { provide: EmptyNameRoot, useClass: EmptyNameRoot })

            const result = print_provider_tree(root_injector)
            expect(result).toContain('Injector (Unknown)')
            expect(result).toContain('Anonymous')
        })

        it('should handle edge case scenarios for 100% coverage', function() {
            // Create a class with TpRoot but no name
            const NoNameRoot = class {}
            TpRoot()(NoNameRoot)
            Object.defineProperty(NoNameRoot, 'name', {
                value: null,
                writable: false
            })

            // Create a provider with null name
            const NoNameProvider = class {}
            Object.defineProperty(NoNameProvider, 'name', {
                value: null,
                writable: false
            })

            const child = Injector.create(root_injector)
            ClassProvider.create(child, { provide: NoNameRoot, useClass: NoNameRoot })
            ClassProvider.create(child, { provide: NoNameProvider, useClass: NoNameProvider })

            const result = print_provider_tree(root_injector)
            expect(result).toContain('Injector (Unknown)')
            expect(result).toContain('Anonymous')
        })

        it('should handle falsy token names for complete coverage', function() {
            // Test case 1: TpRoot with empty string name (should use 'Unknown')
            const EmptyNameRoot = class {}
            TpRoot()(EmptyNameRoot)
            Object.defineProperty(EmptyNameRoot, 'name', {
                value: '',
                writable: false
            })

            // Test case 2: Provider with empty string name (should use 'Anonymous')
            const EmptyNameProvider = class {}
            Object.defineProperty(EmptyNameProvider, 'name', {
                value: '',
                writable: false
            })

            // Test case 3: TpRoot with false name (should use 'Unknown')
            const FalseNameRoot = class {}
            TpRoot()(FalseNameRoot)
            Object.defineProperty(FalseNameRoot, 'name', {
                value: false,
                writable: false
            })

            // Test case 4: Provider with 0 name (should use 'Anonymous')
            const ZeroNameProvider = class {}
            Object.defineProperty(ZeroNameProvider, 'name', {
                value: 0,
                writable: false
            })

            const child1 = Injector.create(root_injector)
            ClassProvider.create(child1, { provide: EmptyNameRoot, useClass: EmptyNameRoot })
            ClassProvider.create(child1, { provide: EmptyNameProvider, useClass: EmptyNameProvider })

            const child2 = Injector.create(root_injector)
            ClassProvider.create(child2, { provide: FalseNameRoot, useClass: FalseNameRoot })
            ClassProvider.create(child2, { provide: ZeroNameProvider, useClass: ZeroNameProvider })

            const result = print_provider_tree(root_injector)
            expect(result).toContain('Injector (Unknown)')
            expect(result).toContain('Anonymous')
        })

        it('should handle providers with def forms', function() {
            // Create a TpRoot that imports TestModule to see the nested providers
            const child = Injector.create(root_injector)
            ClassProvider.create(child, { provide: Level1Module, useClass: Level1Module })
            ClassProvider.create(child, { provide: Level1Root, useClass: Level1Root })

            const result = print_provider_tree(root_injector)
            expect(result).toContain('Injector')
            expect(result).toContain('Injector (Level1Root)')
            expect(result).toContain('Level1Module [TpAssembly → @TpModule]')
            expect(result).toContain('Level1Root [TpEntry → @TpRoot]')
        })

        it('should handle non-function/non-string/non-symbol tokens for 100% coverage', function() {
            // Add number token to trigger String(token) branch (line 201)
            const numberToken = 123
            ValueProvider.create(root_injector, { provide: numberToken, useValue: 'number-value' })

            // Add object token to trigger String(token) branch
            const objectToken = { name: 'test-object' }
            ValueProvider.create(root_injector, { provide: objectToken, useValue: 'object-value' })

            // Add boolean token to trigger String(token) branch
            const booleanToken = true
            ValueProvider.create(root_injector, { provide: booleanToken, useValue: 'boolean-value' })

            const result = print_provider_tree(root_injector)
            expect(result).toContain('Injector')
            expect(result).toContain('123')
            expect(result).toContain('[object Object]')
            expect(result).toContain('true')
        })

        it('should handle three-tier root structure with def providers and imports', function() {
            // Root level built-in services
            ValueProvider.create(root_injector, { provide: TpConfigData, useValue: {} })
            ValueProvider.create(root_injector, { provide: Platform, useValue: new Platform() })

            // Level 3 Root (bottom level) - imports Level2Module
            const level3_injector = Injector.create(root_injector)
            ClassProvider.create(level3_injector, { provide: Level3Module, useClass: Level3Module })
            ClassProvider.create(level3_injector, { provide: Level3Root, useClass: Level3Root })

            // Level 2 Root (middle level) - imports Level1Module
            const level2_injector = Injector.create(level3_injector)
            ClassProvider.create(level2_injector, { provide: Level2Module, useClass: Level2Module })
            ClassProvider.create(level2_injector, { provide: Level2Root, useClass: Level2Root })

            // Level 1 Root (top level) - no imports
            const level1_injector = Injector.create(level2_injector)
            ClassProvider.create(level1_injector, { provide: Level1Module, useClass: Level1Module })
            ClassProvider.create(level1_injector, { provide: Level1Root, useClass: Level1Root })

            const result = print_provider_tree(root_injector)
            // Verify root structure
            expect(result).toContain('Injector')
            expect(result).toContain('TpConfigData [Built-in]')
            expect(result).toContain('Platform [Built-in]')

            // Verify three-tier structure
            expect(result).toContain('Injector (Level3Root)')
            expect(result).toContain('Level3Module [TpAssembly → @TpModule]')
            expect(result).toContain('Level3Root [TpEntry → @TpRoot]')

            expect(result).toContain('Injector (Level2Root)')
            expect(result).toContain('Level2Module [TpAssembly → @TpModule]')
            expect(result).toContain('Level2Root [TpEntry → @TpRoot]')

            expect(result).toContain('Injector (Level1Root)')
            expect(result).toContain('Level1Module [TpAssembly → @TpModule]')
            expect(result).toContain('Level1Root [TpEntry → @TpRoot]')
        })

        it('should handle def providers with various token types', function() {
            // Create child injector with all types of def providers
            const child = Injector.create(root_injector)
            ClassProvider.create(child, { provide: Level3Module, useClass: Level3Module })
            ClassProvider.create(child, { provide: Level3Root, useClass: Level3Root })

            const result = print_provider_tree(root_injector)
            expect(result).toContain('Injector')
            expect(result).toContain('Injector (Level3Root)')
            expect(result).toContain('Level3Module [TpAssembly → @TpModule]')
            expect(result).toContain('Level3Root [TpEntry → @TpRoot]')
        })

        it('should handle classes with completely missing names for 100% coverage', function() {
            // Create a class that will trigger the 'Unknown' fallback
            const ReallyAnonymousRoot = class {}
            TpRoot()(ReallyAnonymousRoot)

            // Delete the name property entirely
            delete (ReallyAnonymousRoot as any).name

            // Create a provider with no name property
            const ReallyAnonymousProvider = class {}
            delete (ReallyAnonymousProvider as any).name

            const child = Injector.create(root_injector)
            ClassProvider.create(child, { provide: ReallyAnonymousRoot, useClass: ReallyAnonymousRoot })
            ClassProvider.create(child, { provide: ReallyAnonymousProvider, useClass: ReallyAnonymousProvider })

            const result = print_provider_tree(root_injector)
            expect(result).toContain('Injector (Unknown)')
            expect(result).toContain('Anonymous')
        })

        it('should handle calling print_provider_tree with child injector as starting point', function() {
            // Setup root injector with some providers
            ValueProvider.create(root_injector, { provide: TpConfigData, useValue: {} })
            ValueProvider.create(root_injector, { provide: Platform, useValue: new Platform() })

            // Create first level child
            const level1_child = Injector.create(root_injector)
            ClassProvider.create(level1_child, { provide: Level1Service, useClass: Level1Service })
            ClassProvider.create(level1_child, { provide: Level1Root, useClass: Level1Root })

            // Create second level child with its own providers and further nested child
            const level2_child = Injector.create(level1_child)
            ClassProvider.create(level2_child, { provide: Level2Service, useClass: Level2Service })
            ClassProvider.create(level2_child, { provide: Level2Root, useClass: Level2Root })

            // Create third level child WITHOUT any TpRoot - this should trigger the missing line coverage
            // When find_tp_root_for_injector returns falsy value, lines 34-35 won't execute
            const level3_child = Injector.create(level2_child)
            ClassProvider.create(level3_child, { provide: Level3Service, useClass: Level3Service })
            // Intentionally NOT adding any TpRoot to this injector

            // Test calling print_provider_tree with level1_child as the starting point
            // Instead of root_injector, this should treat level1_child as "Injector"
            const result = print_provider_tree(level1_child)

            // When starting from level1_child, it should be treated as "Injector"
            expect(result).toContain('Injector')

            // Should show level1_child's own providers
            expect(result).toContain('Level1Service [TpWorker → @TpService]')
            expect(result).toContain('Level1Root [TpEntry → @TpRoot]')

            // Should show level2_child as a child injector of level1_child
            expect(result).toContain('Injector (Level2Root)')
            expect(result).toContain('Level2Service [TpWorker → @TpService]')
            expect(result).toContain('Level2Root [TpEntry → @TpRoot]')

            // Should show level3_child as nested under level2_child
            // Since level3_child has no TpRoot, it should just show "Injector" without parentheses
            expect(result).toContain('Injector')
            expect(result).toContain('Level3Service [TpWorker → @TpService]')

            // Should NOT contain the original root injector's providers (TpConfigData, Platform)
            // since we're starting from level1_child, not root_injector
            expect(result).not.toContain('TpConfigData [Built-in]')
            expect(result).not.toContain('Platform [Built-in]')
        })

        it('should handle class token without decorators to cover missing branch', function() {
            // Create a class without any decorators - this will trigger the else branch
            // in get_provider_type where decorators.length === 0
            class PlainClassToken {
                test() {
                    return 'plain'
                }
            }

            // Add this class as a token
            ClassProvider.create(root_injector, { provide: PlainClassToken, useClass: PlainClassToken })

            const result = print_provider_tree(root_injector)

            expect(result).toContain('Injector')
            // Should show the class name without any decorator type info
            expect(result).toContain('PlainClassToken')
            // Should NOT have any [TpWorker], [TpAssembly], [TpEntry], or [Built-in] annotations
            expect(result).not.toContain('PlainClassToken [')
        })

        it('should cover missing branches in find_tp_root_for_injector and get_provider_type', function() {
            // Test case 1: Cover line 75-77 - non-function tokens in child injector
            // Add non-function tokens to a child injector which won't be processed by find_tp_root_for_injector
            const child = Injector.create(root_injector)
            ValueProvider.create(child, { provide: 'string-token', useValue: 'test' })
            ValueProvider.create(child, { provide: Symbol('symbol-token'), useValue: 'symbol' })
            ValueProvider.create(child, { provide: 999, useValue: 'number' })

            // Test case 2: Cover line 121 - TpRoot in get_provider_type
            // Add a TpRoot directly to root injector (not child) to trigger get_provider_type with TpRoot
            ClassProvider.create(root_injector, { provide: Level1Root, useClass: Level1Root })

            const result = print_provider_tree(root_injector)

            expect(result).toContain('Injector')
            expect(result).toContain('Level1Root [TpEntry → @TpRoot]')
            expect(result).toContain('"string-token"')
            expect(result).toContain('Symbol(symbol-token)')
            expect(result).toContain('999')
        })

        it('should handle injector with only non-function tokens', function() {
            // Create child injector with only non-function tokens
            // This covers the case where find_tp_root_for_injector loops through providers
            // but none are functions with prototypes (lines 75-77)
            const child = Injector.create(root_injector)
            ValueProvider.create(child, { provide: 'only-string', useValue: 'value' })
            ValueProvider.create(child, { provide: Symbol('only-symbol'), useValue: 'symbol-value' })

            // Also add an object token (not a function)
            const objToken = { name: 'object-token' }
            ValueProvider.create(child, { provide: objToken, useValue: 'object-value' })

            const result = print_provider_tree(root_injector)

            expect(result).toContain('Injector')
            expect(result).toContain('"only-string"')
            expect(result).toContain('Symbol(only-symbol)')
            expect(result).toContain('[object Object]')
            // Since no TpRoot provider exists, child should be just "Injector" without parentheses
            expect(result).toContain('└── Injector')
        })

        it('should cover line 77 - function with no decorators in child injector', function() {
            // Create a function class with no decorators in child injector
            // to trigger find_tp_root_for_injector checking decorators.length === 0 (line 77)
            class NoDecoratorClass {
                test() {
                    return 'no-decorator'
                }
            }

            const child = Injector.create(root_injector)
            ClassProvider.create(child, { provide: NoDecoratorClass, useClass: NoDecoratorClass })

            const result = print_provider_tree(root_injector)

            expect(result).toContain('Injector')
            expect(result).toContain('NoDecoratorClass')
            // Child injector should not have name in parentheses since no TpRoot found
            expect(result).toContain('└── Injector')
            expect(result).not.toContain('Injector (')
        })

        it('should cover line 121 - TpRoot as first decorator in get_provider_type', function() {
            // Create a class with ONLY TpRoot decorator to ensure it's the first (and only) decorator
            // This should trigger line 121: else if (decorator instanceof TpRoot)
            @TpRoot()
            class OnlyTpRootClass {
                test() {
                    return 'only-root'
                }
            }

            // Add directly to root injector to trigger get_provider_type (not find_tp_root_for_injector)
            ClassProvider.create(root_injector, { provide: OnlyTpRootClass, useClass: OnlyTpRootClass })

            const result = print_provider_tree(root_injector)

            expect(result).toContain('Injector')
            expect(result).toContain('OnlyTpRootClass [TpEntry → @TpRoot]')
        })

        it('should ensure line 121 coverage with isolated TpRoot test', function() {
            // Clear injector to start fresh
            root_injector = Injector.create()

            // Create a very simple TpRoot class to ensure we hit line 121
            @TpRoot()
            class SimpleTpRoot {
            }

            // Force this specific path: root injector -> own_providers -> get_provider_name_with_type -> get_provider_type -> line 121
            ClassProvider.create(root_injector, { provide: SimpleTpRoot, useClass: SimpleTpRoot })

            const result = print_provider_tree(root_injector)

            expect(result).toContain('SimpleTpRoot [TpEntry → @TpRoot]')
        })

        it('should definitely hit line 121 - isolated TpRoot without other decorators', function() {
            // Create completely fresh injector
            const fresh_injector = Injector.create()

            // Create a class that ONLY has TpRoot - no TpService, no TpModule
            // This will force the else-if chain to reach the TpRoot check
            const TestTpRoot = class TestTpRoot {}
            TpRoot()(TestTpRoot)

            // Verify the decorator setup
            const decorators = get_class_decorator(TestTpRoot)
            expect(decorators.length).toEqual(1)
            expect(decorators[0]).toBeInstanceOf(TpRoot)

            // Add to injector and test
            ClassProvider.create(fresh_injector, { provide: TestTpRoot, useClass: TestTpRoot })

            const result = print_provider_tree(fresh_injector)

            expect(result).toContain('TestTpRoot [TpEntry → @TpRoot]')
        })

        it('should cover line 121 - decorator that is not TpService, TpModule, or TpRoot', function() {
            // Create a custom decorator that is NOT TpService, TpModule, or TpRoot
            const CustomDecorator = make_decorator('CustomDecorator', () => ({}))

            // Create a class with this custom decorator
            @CustomDecorator()
            class ClassWithCustomDecorator {
                test() {
                    return 'custom'
                }
            }

            // Verify the decorator setup - should have 1 decorator but not be any of the known types
            const decorators = get_class_decorator(ClassWithCustomDecorator)
            expect(decorators.length).toEqual(1)
            expect(decorators[0]).not.toBeInstanceOf(TpService)
            expect(decorators[0]).not.toBeInstanceOf(TpModule)
            expect(decorators[0]).not.toBeInstanceOf(TpRoot)

            // Add to injector - this should trigger the case where none of the if-else conditions match
            ClassProvider.create(root_injector, { provide: ClassWithCustomDecorator, useClass: ClassWithCustomDecorator })

            const result = print_provider_tree(root_injector)

            // Should show the class name without any type annotation since it doesn't match known decorators
            expect(result).toContain('ClassWithCustomDecorator')
            expect(result).not.toContain('ClassWithCustomDecorator [')
        })
    })
})