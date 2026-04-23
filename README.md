<div align="center">

<img src="public/repfit-logo.png" width="120" alt="REPFIT Logo" />

# REPFIT

**Gym Management SaaS Platform**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth+%20DB-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe&logoColor=white)](https://stripe.com/)

*Active SaaS project at [repfitapp.com](https://repfitapp.com). Open-sourcing the core platform.*

</div>

## 🚀 About REPFIT

REPFIT is a comprehensive gym management and booking platform that serves both fitness enthusiasts and gym owners. As an active SaaS project at [repfitapp.com](https://repfitapp.com), we're open-sourcing our core platform to help the fitness community build better experiences.

### For Athletes
- **Discover Environments** - Instantly locate premium gyms, studios, and recovery centers
- **Instant Booking** - Reserve your spot in real-time. Walk in, scan, and start training
- **One Subscription** - Drop multiple memberships. One token system for every facility

### For Gym Owners
- **Business Engine** - Monetize empty slots, attract new athletes, streamline operations
- **Zero Commission** - Keep 100% of your revenue
- **Smart Management** - Automated scheduling, payments, and member management

## ✨ Key Features

- 🏋️ **Gym Discovery** - Browse and filter facilities by equipment, amenities, and vibe
- 📅 **Real-time Booking** - Instant reservation system with availability tracking
- 💳 **Payment Processing** - Integrated Stripe payments for seamless transactions
- 📊 **Analytics Dashboard** - Comprehensive insights for gym owners and athletes
- 🔐 **Secure Authentication** - Robust user management with Supabase
- 📱 **Responsive Design** - Beautiful mobile-first experience
- 🎨 **Modern UI** - Built with Tailwind CSS and Radix UI components
- ⚡ **Performance** - Optimized with Next.js 15 and React 19

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.0.5 with App Router
- **Language**: TypeScript 5.9.3
- **Styling**: Tailwind CSS 3.4.17
- **Components**: Radix UI, shadcn/ui
- **Animations**: Framer Motion
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts

### Backend & Database
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Email**: Resend
- **File Storage**: Supabase Storage

### Development
- **Package Manager**: npm
- **Linting**: ESLint
- **Testing**: Playwright
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/repfit/repfit.git
   cd repfit
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Stripe
   STRIPE_SECRET_KEY=your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_WEBHOOK_SECRET=your_webhook_secret
   
   # Resend
   RESEND_API_KEY=your_resend_api_key
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

4. **Database setup**
   ```bash
   # Run the master setup script
   npm run db:setup
   
   # Or manually apply migrations
   npm run db:migrate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
repfit/
├── app/                    # Next.js App Router
│   ├── [slug]/            # Dynamic gym pages
│   ├── actions/           # Server actions
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── explore/           # Gym discovery
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Homepage
├── components/            # Reusable UI components
├── lib/                  # Utility functions and configurations
├── public/               # Static assets
├── scripts/              # Database and setup scripts
└── styles/               # Additional styles
```

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run Playwright tests
```

### Database Management

```bash
npm run db:setup     # Initialize database with all tables
npm run db:reset      # Reset database to initial state
npm run db:seed       # Seed database with sample data
```

### Environment Variables

Create a `.env.local` file with the following variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ |
| `STRIPE_SECRET_KEY` | Stripe secret key | ✅ |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | ✅ |
| `RESEND_API_KEY` | Resend API key for emails | ✅ |
| `RESEND_FROM_EMAIL` | From email for notifications | ✅ |

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your repository to [Vercel](https://vercel.com)
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
npm run build
npm start
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js** - The React framework for production
- **Supabase** - Open source Firebase alternative
- **Stripe** - Payment processing platform
- **Radix UI** - Unstyled, accessible components
- **Tailwind CSS** - Utility-first CSS framework
- **Vercel** - Platform for frontend frameworks

## 📞 Support

- **Live Site**: [repfitapp.com](https://repfitapp.com)
- **Documentation**: [docs.repfitapp.com](https://docs.repfitapp.com) (coming soon)
- **Issues**: [GitHub Issues](https://github.com/repfit/repfit/issues)
- **Email**: support@repfitapp.com

## 🔮 Roadmap

- [ ] Mobile apps (iOS/Android)
- [ ] Advanced analytics and insights
- [ ] Integration with fitness trackers
- [ ] Corporate wellness programs
- [ ] International expansion
- [ ] AI-powered workout recommendations

---

<div align="center">

**⭐ Star this repo if it helped you!**

Made with ❤️ by the [REPFIT Team](https://repfitapp.com)

</div>
