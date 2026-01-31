# GST Billing Portal - Enterprise SaaS

A production-ready, enterprise-level, subscription-based GST Billing SaaS Portal built with Next.js 14+ (App Router), TypeScript, and Tailwind CSS.

## 🚀 Features

### Core Modules
- **GST Billing**: Create and manage GST invoices with automatic tax calculations
- **E-Way Bill**: Generate and manage E-Way bills for transportation
- **E-Invoice**: Generate IRN and E-Invoices compliant with government standards

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (SUPER_ADMIN, ADMIN, USER)
- Protected routes with middleware
- Login, Register, Forgot Password flows

### Subscription System
- Multiple subscription plans (GST Billing, E-Way Billing, E-Invoice, Combo)
- Subscription status management
- Access control based on active subscriptions
- Expiry date tracking

### UI/UX
- Enterprise-grade design (Zoho/Razorpay/Freshbooks level)
- Responsive layout with Sidebar + Topbar
- Card-based UI with proper spacing and typography
- Professional color palette (Indigo/Blue primary)

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/UI
- **Forms**: React Hook Form + Zod
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Icons**: Lucide React

## 📁 Project Structure

```
src/
 ├─ app/
 │   ├─ (auth)/          # Authentication pages
 │   │   ├─ login/
 │   │   ├─ register/
 │   │   └─ forgot-password/
 │   ├─ (dashboard)/     # Protected dashboard pages
 │   │   ├─ dashboard/
 │   │   ├─ gst/
 │   │   ├─ eway/
 │   │   ├─ einvoice/
 │   │   └─ subscription/
 │   ├─ layout.tsx
 │   └─ page.tsx
 ├─ components/
 │   ├─ ui/              # Shadcn/UI components
 │   └─ common/          # Reusable components
 ├─ services/
 │   └─ gst/             # GST API service layer
 ├─ store/               # Zustand stores
 ├─ lib/                 # Utilities
 ├─ types/               # TypeScript types
 └─ constants/           # Constants and config
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
NEXT_PUBLIC_GST_API_URL=your-gst-api-url
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📝 API Integration

The application includes a service layer architecture ready for GST API integration:

- `services/gst/auth.service.ts` - GST API authentication
- `services/gst/gstInvoice.service.ts` - Invoice management
- `services/gst/eway.service.ts` - E-Way bill generation
- `services/gst/einvoice.service.ts` - E-Invoice and IRN generation

All services support both sandbox and production environments.

## 🔐 Authentication

The app uses JWT tokens stored in Zustand with persistence. Middleware protects routes and redirects unauthenticated users to login.

## 💳 Subscription System

- Plans are managed through the subscription store
- Access to modules is controlled by subscription status
- UI automatically hides/disables inactive modules
- Subscription expiry dates are tracked and displayed

## 🎨 UI Components

All UI components are built with Shadcn/UI and are fully customizable:
- Button, Card, Input, Label
- Table, Dialog, Toast
- Badge, Loader, Empty State
- Sidebar, Topbar

## 📦 Building for Production

```bash
npm run build
npm start
```

## 🔄 Next Steps

1. **Backend Integration**: Connect to your actual backend API
2. **Payment Integration**: Integrate Stripe or Razorpay for subscriptions
3. **Database**: Set up Prisma with PostgreSQL
4. **GST APIs**: Connect to actual GST API endpoints
5. **PDF Generation**: Implement invoice PDF generation
6. **Email Notifications**: Add email service for invoices and notifications

## 📄 License

This project is proprietary software.

## 👥 Support

For issues and questions, please contact the development team.
# gstBillingPortal
