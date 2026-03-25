# GraphDBNext Documentation

This is the official documentation website for GraphDBNext, built with Next.js and Fumadocs.

## About

GraphDBNext is a modern graph database management platform that provides tools for creating, visualizing, and analyzing graph databases. This documentation site contains comprehensive guides, API references, and tutorials to help you get the most out of GraphDBNext.

## Technology Stack

- **Next.js 16** - React framework for the web
- **Fumadocs** - Modern documentation framework
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type-safe JavaScript

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
├── content/docs/          # MDX documentation files
├── src/
│   ├── app/              # Next.js app router pages
│   └── lib/              # Utility functions and configurations
├── source.config.ts      # Fumadocs configuration
└── next.config.ts        # Next.js configuration
```

## Documentation Structure

The documentation is organized into the following sections:

- **Getting Started** - Installation and setup
- **Configuration** - Environment and database setup
- **First Project** - Creating your first project
- **Querying** - Query languages and techniques
- **FAQ** - Common questions and answers

## Adding New Documentation

1. Create a new `.mdx` file in `content/docs/`
2. Add frontmatter with title and description
3. Write your content using MDX syntax
4. Update `content/docs/meta.json` to include the new page
5. The documentation will automatically rebuild

## Development

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Content Updates

Documentation content is stored in `content/docs/` as MDX files. When you make changes to content:

1. The `.source` directory will be automatically regenerated
2. Static pages will be rebuilt
3. Changes will be reflected in the development server

## Deployment

This documentation site can be deployed to various platforms:

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify

```bash
# Build the site
npm run build

# Deploy the .next directory to Netlify
```

### Docker

```bash
# Build Docker image
docker build -t graphdbnext-docs .

# Run container
docker run -p 3000:3000 graphdbnext-docs
```

## Customization

### Styling

The site uses Tailwind CSS for styling. You can customize the appearance by:

1. Editing `tailwind.config.ts`
2. Modifying CSS classes in components
3. Adding custom CSS in `src/app/globals.css`

### Fumadocs Configuration

The Fumadocs configuration is in `source.config.ts`. You can:

- Change content directory
- Add custom MDX components
- Configure metadata settings
- Set up multiple content sources

## Contributing

To contribute to the documentation:

1. Fork the repository
2. Create a feature branch
3. Add or update documentation
4. Submit a pull request

## Support

For questions about GraphDBNext:

- Visit the main [GraphDBNext repository](https://github.com/your-org/graphdbnext)
- Check the [FAQ section](/docs/faq)
- Contact the support team

## License

This documentation is licensed under the same terms as GraphDBNext.

---

*Built with ❤️ using Fumadocs*
