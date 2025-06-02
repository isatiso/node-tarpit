import { load_config } from '@tarpit/config'
import { Platform, TpConfigSchema, TpService } from '@tarpit/core'
import { HttpServerModule, TpRouter, Get, Post, FormBody, TpRequest } from '@tarpit/http'
import { Jtl } from '@tarpit/judge'

// Simple contact form service
@TpService()
class ContactService {
    private submissions: any[] = []
    
    submit_contact(data: any) {
        const submission = {
            id: Date.now().toString(),
            ...data,
            submitted_at: new Date().toISOString()
        }
        this.submissions.push(submission)
        return submission
    }
    
    get_all_submissions() {
        return this.submissions
    }
}

// Router demonstrating form data handling
@TpRouter('/api/forms')
class FormRouter {
    
    constructor(private contact_service: ContactService) {}
    
    @Post('contact')
    async handle_contact_form(body: FormBody<any>) {
        console.log('Processing contact form...')
        
        // Extract form fields
        const name = body.ensure('name', Jtl.string)
        const email = body.ensure('email', Jtl.string)
        const message = body.ensure('message', Jtl.string)
        const newsletter = body.get('newsletter') === 'on'
        
        const submission = this.contact_service.submit_contact({
            name,
            email,
            message,
            newsletter
        })
        
        return {
            success: true,
            message: 'Contact form submitted successfully',
            submission
        }
    }
    
    @Get('submissions')
    async get_submissions() {
        console.log('Getting all form submissions...')
        
        return {
            submissions: this.contact_service.get_all_submissions()
        }
    }
}

// Router with simple HTML form
@TpRouter('/forms')
class HtmlFormRouter {
    
    @Get('contact')
    async show_contact_form() {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Contact Form</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .checkbox { width: auto; }
    </style>
</head>
<body>
    <h1>Contact Form</h1>
    <form action="/api/forms/contact" method="POST">
        <div class="form-group">
            <label for="name">Name:</label>
            <input type="text" id="name" name="name" required>
        </div>
        
        <div class="form-group">
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required>
        </div>
        
        <div class="form-group">
            <label for="message">Message:</label>
            <textarea id="message" name="message" rows="5" required></textarea>
        </div>
        
        <div class="form-group">
            <label>
                <input type="checkbox" name="newsletter" class="checkbox"> 
                Subscribe to newsletter
            </label>
        </div>
        
        <button type="submit">Send Message</button>
    </form>
    
    <hr>
    <p><a href="/forms/submissions">View all submissions</a></p>
</body>
</html>`
        
        return html
    }
    
    @Get('submissions')
    async show_submissions(req: TpRequest) {
        console.log('Showing submissions page...')
        
        // This would typically use the contact service
        // For simplicity, showing static content
        
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Form Submissions</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .submission { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 4px; }
        .back-link { color: #007bff; text-decoration: none; }
        .back-link:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>Form Submissions</h1>
    <p><a href="/forms/contact" class="back-link">← Back to Contact Form</a></p>
    
    <div class="submission">
        <h3>Sample Submission</h3>
        <p><strong>Name:</strong> John Doe</p>
        <p><strong>Email:</strong> john@example.com</p>
        <p><strong>Message:</strong> This is a sample message.</p>
        <p><strong>Newsletter:</strong> Yes</p>
        <p><strong>Submitted:</strong> ${new Date().toISOString()}</p>
    </div>
    
    <p><em>To see real submissions, use the API endpoint: GET /api/forms/submissions</em></p>
</body>
</html>`
        
        return html
    }
}

async function main() {
    console.log('=== Form Handling Example ===\n')
    
    const config = load_config<TpConfigSchema>({ 
        http: { port: 4203 } 
    })
    
    const platform = new Platform(config)
        .import(HttpServerModule)
        .import(ContactService)
        .import(FormRouter)
        .import(HtmlFormRouter)
    
    await platform.start()
    
    console.log('HTTP Server started on http://localhost:4203')
    console.log('\n=== Available Endpoints ===')
    console.log('HTML Forms:')
    console.log('  GET    /forms/contact           - Show contact form (HTML)')
    console.log('  GET    /forms/submissions       - Show submissions (HTML)')
    console.log('\nAPI Endpoints:')
    console.log('  POST   /api/forms/contact       - Submit contact form')
    console.log('  GET    /api/forms/submissions   - Get all submissions (JSON)')
    
    console.log('\n=== Test Instructions ===')
    console.log('1. Open http://localhost:4203/forms/contact in your browser')
    console.log('2. Fill out and submit the contact form')
    console.log('3. View submissions at http://localhost:4203/forms/submissions')
    console.log('4. Or use API: curl http://localhost:4203/api/forms/submissions')
    
    console.log('\n=== Test with curl ===')
    console.log('curl -X POST http://localhost:4203/api/forms/contact \\')
    console.log('  -H "Content-Type: application/x-www-form-urlencoded" \\')
    console.log('  -d "name=John Doe&email=john@example.com&message=Hello World&newsletter=on"')
    
    console.log('\nPress Ctrl+C to stop the server')
}

if (require.main === module) {
    main().catch(console.error)
} 