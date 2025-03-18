# Club Forms Registration System

A streamlined platform for managing college club registrations and event forms.

## Features

- User authentication and role management (Admin, President, Member)
- Form creation and management
- Image uploads for form submissions
- Responsive design for all devices
- Dark mode support

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS for styling
- Framer Motion for animations
- Supabase for authentication and database
- React Router for navigation
- Vercel for deployment

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- A Supabase account for backend services

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ClubFormsRegistrations.git
   cd ClubFormsRegistrations
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update with your Supabase credentials
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

The application requires these environment variables:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon/public key

For production deployments, set these in your hosting platform (Vercel, Netlify, etc.)

## Deployment

### Vercel Deployment

1. Push your repository to GitHub
2. Connect your GitHub repository to Vercel
3. Add environment variables in Vercel project settings
4. Deploy from the Vercel dashboard

### Build for Production

```bash
npm run build
```

This generates optimized files in the `dist` folder.

## Security

- API keys are stored as environment variables
- Authentication handled securely via Supabase
- Security headers implemented via `vercel.json`
- Image upload validation to prevent malicious files

## Routes

- `/auth` - Authentication page
- `/role` - Role selection
- `/dashboard` - User dashboard
- `/forms/new` - Create new form
- `/forms/:id` - View form
- `/forms/:id/edit` - Edit form
- `/forms/:id/respond` - Respond to form

## License

MIT

## Contact

For support or questions:
nithinreddygaddam99@gmail.com 