# Tarpit Documentation

This directory contains the Docusaurus documentation site for the Tarpit framework.

## Development

### Prerequisites

- Node.js 18 or higher
- Yarn package manager

### Local Development

```bash
# Install dependencies
yarn install

# Start development server
yarn start

# This command starts a local development server and opens up a browser window.
# Most changes are reflected live without having to restart the server.
```

### Building

```bash
# Build the static site
yarn build

# This command generates static content into the `build` directory
# and can be served using any static contents hosting service.
```

### Serving Built Site

```bash
# Serve the built site locally
yarn serve

# This command serves the built site locally for testing.
```

## Internationalization

The site supports both English and Chinese:

- English (default): `/docs/`
- Chinese: `/zh/docs/`

### Adding Translations

```bash
# Generate translation files
yarn write-translations --locale zh

# This creates translation files in the i18n/zh directory
```

## Documentation Structure

```
docs/
├── docs/                    # English documentation
│   ├── intro.md            # Introduction page
│   ├── core/               # Core module docs
│   ├── http-server/        # HTTP Server module docs
│   ├── rabbitmq-client/    # RabbitMQ Client module docs
│   ├── schedule/           # Schedule module docs
│   └── content-type/       # Content Type module docs
├── i18n/zh/                # Chinese translations
│   └── docusaurus-plugin-content-docs/
│       └── current/        # Chinese documentation
├── src/                    # React components and pages
├── static/                 # Static assets
└── docusaurus.config.ts    # Docusaurus configuration
```

## Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the `main` branch.

### GitHub Actions Workflow

The deployment is handled by `.github/workflows/pages.yml` which:

1. Installs Node.js and dependencies
2. Builds the Docusaurus site
3. Uploads the build artifacts
4. Deploys to GitHub Pages

### Manual Deployment

If needed, you can also deploy manually:

```bash
# Build and deploy to GitHub Pages
yarn deploy

# Note: This requires proper Git configuration and permissions
```

## Configuration

### Site Configuration

Main configuration is in `docusaurus.config.ts`:

- Site metadata (title, tagline, etc.)
- Internationalization settings
- Theme configuration
- Plugin configuration

### Navigation

Sidebar navigation is configured in `sidebars.ts`.

## Writing Documentation

### Creating New Pages

1. Create a new `.md` file in the appropriate directory under `docs/`
2. Add front matter with metadata
3. Update `sidebars.ts` if needed

### Adding Images

Place images in the `static/img/` directory and reference them as `/img/filename.png`.

### Code Examples

Use fenced code blocks with language specification:

```typescript
// TypeScript example
import { TpService } from '@tarpit/core'

@TpService()
class MyService {
    // ...
}
```

## Styling

Custom CSS is located in `src/css/custom.css`. The site uses Docusaurus's default theme with custom modifications.

## Build Output

The built site is generated in the `build/` directory:

- `build/index.html` - Main page
- `build/docs/` - English documentation
- `build/zh/` - Chinese documentation
- `build/assets/` - Static assets
- `build/.nojekyll` - Prevents GitHub Pages from using Jekyll
