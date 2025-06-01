import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'
import { HttpServerModule, TpRouter, Get, Post, Put, Delete, PathArgs, TpHttpFinish } from '@tarpit/http'
import { Jtl } from '@tarpit/judge'

// Sample data models
interface User {
    id: string
    name: string
    email: string
    team_id?: string
}

interface Team {
    id: string
    name: string
    department: string
}

// Data service with sample data
@TpService()
class DataService {
    private users = new Map<string, User>()
    private teams = new Map<string, Team>()
    
    constructor() {
        // Initialize with sample data
        this.teams.set('team1', { id: 'team1', name: 'Frontend Team', department: 'Engineering' })
        this.teams.set('team2', { id: 'team2', name: 'Backend Team', department: 'Engineering' })
        this.teams.set('team3', { id: 'team3', name: 'Design Team', department: 'Product' })
        
        this.users.set('user1', { id: 'user1', name: 'Alice', email: 'alice@example.com', team_id: 'team1' })
        this.users.set('user2', { id: 'user2', name: 'Bob', email: 'bob@example.com', team_id: 'team1' })
        this.users.set('user3', { id: 'user3', name: 'Charlie', email: 'charlie@example.com', team_id: 'team2' })
    }
    
    get_user(id: string): User | undefined {
        return this.users.get(id)
    }
    
    get_team(id: string): Team | undefined {
        return this.teams.get(id)
    }
    
    get_users_by_team(team_id: string): User[] {
        return Array.from(this.users.values()).filter(user => user.team_id === team_id)
    }
    
    create_user(user: Omit<User, 'id'>): User {
        const id = `user${Date.now()}`
        const new_user = { id, ...user }
        this.users.set(id, new_user)
        return new_user
    }
    
    update_user(id: string, updates: Partial<User>): User | null {
        const user = this.users.get(id)
        if (!user) return null
        
        const updated_user = { ...user, ...updates }
        this.users.set(id, updated_user)
        return updated_user
    }
    
    delete_user(id: string): boolean {
        return this.users.delete(id)
    }
}

// Router demonstrating basic path parameters
@TpRouter('/api/users')
class UserRouter {
    
    constructor(private data_service: DataService) {}
    
    @Get(':id')
    async get_user(args: PathArgs<{ id: string }>) {
        // Extract and validate path parameter
        const id = args.ensure('id', Jtl.string)
        
        const user = this.data_service.get_user(id)
        if (!user) {
            throw new TpHttpFinish({ 
                status: 404, 
                code: 'USER_NOT_FOUND',
                msg: `User with id ${id} not found` 
            })
        }
        
        return user
    }
    
    @Put(':id/profile')
    async update_profile(args: PathArgs<{ id: string }>) {
        const id = args.ensure('id', Jtl.string)
        
        // Simulate profile update
        const updated_user = this.data_service.update_user(id, {
            name: `Updated User ${id}`,
        })
        
        if (!updated_user) {
            throw new TpHttpFinish({ 
                status: 404, 
                code: 'USER_NOT_FOUND',
                msg: `User ${id} not found` 
            })
        }
        
        return {
            message: 'Profile updated successfully',
            user: updated_user
        }
    }
    
    @Delete(':id')
    async delete_user(args: PathArgs<{ id: string }>) {
        const id = args.ensure('id', Jtl.string)
        
        const deleted = this.data_service.delete_user(id)
        if (!deleted) {
            throw new TpHttpFinish({ 
                status: 404, 
                code: 'USER_NOT_FOUND',
                msg: `User ${id} not found` 
            })
        }
        
        return {
            message: `User ${id} deleted successfully`,
            deleted: true
        }
    }
}

// Router demonstrating multiple path parameters
@TpRouter('/api/teams')
class TeamRouter {
    
    constructor(private data_service: DataService) {}
    
    @Get(':team_id/members/:member_id')
    async get_team_member(args: PathArgs<{ team_id: string, member_id: string }>) {
        const team_id = args.ensure('team_id', Jtl.string)
        const member_id = args.ensure('member_id', Jtl.string)
        
        // Verify team exists
        const team = this.data_service.get_team(team_id)
        if (!team) {
            throw new TpHttpFinish({ 
                status: 404, 
                code: 'TEAM_NOT_FOUND',
                msg: `Team ${team_id} not found` 
            })
        }
        
        // Verify user exists and belongs to team
        const user = this.data_service.get_user(member_id)
        if (!user) {
            throw new TpHttpFinish({ 
                status: 404, 
                code: 'USER_NOT_FOUND',
                msg: `User ${member_id} not found` 
            })
        }
        
        if (user.team_id !== team_id) {
            throw new TpHttpFinish({ 
                status: 400, 
                code: 'USER_NOT_IN_TEAM',
                msg: `User ${member_id} is not a member of team ${team_id}` 
            })
        }
        
        return {
            team,
            member: user,
            relationship: 'team_member'
        }
    }
    
    @Get(':team_id/members')
    async get_team_members(args: PathArgs<{ team_id: string }>) {
        const team_id = args.ensure('team_id', Jtl.string)
        
        const team = this.data_service.get_team(team_id)
        if (!team) {
            throw new TpHttpFinish({ 
                status: 404, 
                code: 'TEAM_NOT_FOUND',
                msg: `Team ${team_id} not found` 
            })
        }
        
        const members = this.data_service.get_users_by_team(team_id)
        
        return {
            team,
            members,
            member_count: members.length
        }
    }
}

// Router demonstrating numeric path parameters
@TpRouter('/api/posts')
class PostRouter {
    @Get(':id')
    async get_post(args: PathArgs<{ id: string }>) {
        // Validate and convert to number
        const id_str = args.ensure('id', Jtl.string)
        const id = parseInt(id_str)
        
        if (isNaN(id) || id < 1) {
            throw new TpHttpFinish({
                status: 400,
                code: 'INVALID_POST_ID',
                msg: 'Post ID must be a positive integer'
            })
        }
        
        return {
            id,
            title: `Post ${id}`,
            content: `This is the content of post number ${id}`,
            author: 'Sample Author'
        }
    }
    
    @Get(':id/comments/:comment_id')
    async get_comment(args: PathArgs<{ id: string, comment_id: string }>) {
        const post_id_str = args.ensure('id', Jtl.string)
        const comment_id_str = args.ensure('comment_id', Jtl.string)
        
        const post_id = parseInt(post_id_str)
        const comment_id = parseInt(comment_id_str)
        
        if (isNaN(post_id) || post_id < 1) {
            throw new TpHttpFinish({
                status: 400,
                code: 'INVALID_POST_ID',
                msg: 'Post ID must be a positive integer'
            })
        }
        
        if (isNaN(comment_id) || comment_id < 1) {
            throw new TpHttpFinish({
                status: 400,
                code: 'INVALID_COMMENT_ID',
                msg: 'Comment ID must be a positive integer'
            })
        }
        
        return {
            post_id,
            comment_id,
            content: `This is comment ${comment_id} on post ${post_id}`,
            author: 'Commenter'
        }
    }
}

// Router demonstrating optional parameters and wildcards
@TpRouter('/api/docs')
class DocsRouter {
    @Get('page/:section?')
    async get_docs(args: PathArgs<{ section?: string }>) {
        const section = args.get('section') // Returns undefined if not present
        
        if (section) {
            return {
                page: 'docs',
                section,
                content: `Documentation for section: ${section}`
            }
        } else {
            return {
                page: 'docs',
                sections: ['intro', 'api', 'examples', 'deployment'],
                message: 'Available documentation sections'
            }
        }
    }
}

async function main() {
    console.log('=== Path Parameters Example ===\n')
    
    const config = load_config<TpConfigSchema>({ 
        http: { port: 4201 } 
    })
    
    const platform = new Platform(config)
        .import(HttpServerModule)
        .import(DataService)
        .import(UserRouter)
        .import(TeamRouter)
        .import(PostRouter)
        .import(DocsRouter)
    
    await platform.start()
    
    console.log('HTTP Server started on http://localhost:4201')
    console.log('\n=== Available Endpoints ===')
    console.log('User Management:')
    console.log('  GET    /api/users/:id              - Get user by ID')
    console.log('  PUT    /api/users/:id/profile      - Update user profile')
    console.log('  DELETE /api/users/:id              - Delete user')
    console.log('\nTeam Management:')
    console.log('  GET    /api/teams/:team_id/members - Get team members')
    console.log('  GET    /api/teams/:team_id/members/:member_id - Get specific team member')
    console.log('\nPost Management:')
    console.log('  GET    /api/posts/:id              - Get post (numeric ID)')
    console.log('  GET    /api/posts/:id/comments/:comment_id - Get comment (nested numeric IDs)')
    console.log('\nDocumentation:')
    console.log('  GET    /api/docs/page              - List all sections')
    console.log('  GET    /api/docs/page/:section     - Get specific section')
    
    console.log('\n=== Test Commands ===')
    console.log('# User endpoints')
    console.log('curl http://localhost:4201/api/users/user1')
    console.log('curl -X PUT http://localhost:4201/api/users/user1/profile')
    console.log('curl -X DELETE http://localhost:4201/api/users/user1')
    
    console.log('\n# Team endpoints')
    console.log('curl http://localhost:4201/api/teams/team1/members')
    console.log('curl http://localhost:4201/api/teams/team1/members/user1')
    
    console.log('\n# Post endpoints')
    console.log('curl http://localhost:4201/api/posts/123')
    console.log('curl http://localhost:4201/api/posts/123/comments/456')
    
    console.log('\n# Documentation endpoints')
    console.log('curl http://localhost:4201/api/docs/page')
    console.log('curl http://localhost:4201/api/docs/page/api')
    
    console.log('\n# Error cases')
    console.log('curl http://localhost:4201/api/users/nonexistent')
    console.log('curl http://localhost:4201/api/posts/invalid-id')
    
    console.log('\nPress Ctrl+C to stop the server')
}

if (require.main === module) {
    main().catch(console.error)
} 