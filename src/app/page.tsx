"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES, SUBSCRIPTION_PLANS } from "@/constants";
import { ScrollAnimation } from "@/components/common/scroll-animation";
import {
  FileText,
  Truck,
  Receipt,
  CheckCircle2,
  Shield,
  Zap,
  BarChart3,
  Clock,
  Users,
  ArrowRight,
  Star,
  Database,
  Globe,
  Phone,
  Mail,
  Sparkles,
} from "lucide-react";

const mainProducts = [
  {
    icon: FileText,
    title: "GST Billing",
    subtitle: "GST Software",
    description: "GST Software designed to manage multiple clients / GSTINs / Businesses at one place. One time effort of adding your client and manage all at one place and avoid OTP generation all the time.",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    route: ROUTES.GST.ROOT,
  },
  {
    icon: Receipt,
    title: "E-Invoice",
    subtitle: "e-Invoice Software",
    description: "Manage your digital invoices on the cloud. You can create digital invoices, track payments and receipts and send digital invoices to customers over mail. A simplified dashboard helps to know how the business is doing at real time.",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    route: ROUTES.EINVOICE.ROOT,
  },
  {
    icon: Truck,
    title: "E-Way Bill",
    subtitle: "e-Way Bill Software",
    description: "You can create and manage e-Way Bills at one click and auto-populate your invoice details and create Eway bills. We maintain all your way bills for years long with complete compliance.",
    color: "text-green-600",
    bgColor: "bg-green-50",
    route: ROUTES.EWAY.ROOT,
  },
];


const features = [
  {
    icon: Shield,
    title: "100% GST Compliant",
    description: "All features comply with GST regulations and government standards. GSP certified and ISO certified company.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Generate invoices, E-Way bills, and E-Invoices in seconds. No waiting time. One-click generation.",
  },
  {
    icon: Database,
    title: "Multi-GSTIN Management",
    description: "Manage multiple clients, GSTINs, and businesses from one centralized dashboard. Avoid OTP generation all the time.",
  },
  {
    icon: BarChart3,
    title: "Real-time Reports & Analytics",
    description: "Track all your billing data with comprehensive reports. Simplified dashboard helps to know how the business is doing at real time.",
  },
  {
    icon: Clock,
    title: "Save Time & Money",
    description: "Automate your billing process and focus on growing your business. No need of accounting or finance expert.",
  },
  {
    icon: Globe,
    title: "Cloud-Based Access",
    description: "Access your data anywhere, anytime. No software installation required. Works on any device with internet.",
  },
];

const testimonials = [
  {
    name: "Sahil Jain",
    position: "Director - Smartbiz Technologies Pvt. Ltd.",
    content: "I just wanted to share a quick note and let you know that you guys do a really good job. I'm glad I decided to do business with you. The integration is so quick and smooth. When it comes to support, you guys have always been there round the clock. Thanks!",
    rating: 5,
  },
  {
    name: "B V Srinivasababu",
    position: "Sr Manager - IT Applications NSL",
    content: "GST Portal helped me to Generate the e-Invoices and e-Way Bills in a single click. The system is efficient, simple and cost effective. Highly recommended for businesses of all sizes.",
    rating: 5,
  },
  {
    name: "CA Atul Garg",
    position: "Finance Controller - WheelsEye",
    content: "GST Portal is solving GST complex problem like E Invoicing, e-Way Bill with Ease and Simple interface. I recommend to use GST Portal for all your GST needs to make your system future ready.",
    rating: 5,
  },
];

const stats = [
  { number: "10 Crores+", label: "Invoices Created" },
  { number: "12,000+", label: "Businesses Trusted Us" },
  { number: "8,000+", label: "Cities & Towns In India" },
  { number: "5,000+", label: "CA's & Tax Professionals" },
];

const faqs = [
  {
    question: "What is GST Portal GST software?",
    answer: "GST Portal is a comprehensive solution that enables businesses to manage their Goods and Services Tax (GST) compliance processes. It simplifies GST calculations, facilitates invoice generation, streamlines return filing, and helps maintain accurate GST records.",
  },
  {
    question: "What is GST Portal e-Invoice software?",
    answer: "GST Portal e-Invoice software automates the generation, validation, and management of electronic invoices in compliance with regulatory requirements. It simplifies creating and processing e-Invoices, reducing manual efforts and enhancing efficiency.",
  },
  {
    question: "What is GST Portal e-Way Bill software?",
    answer: "GST Portal e-Way Bill software streamlines the generation and management of electronic waybills for the seamless transportation of goods. It ensures compliance with e-Way Bill regulations by simplifying the e-Way Bill generation process and providing real-time tracking.",
  },
  {
    question: "How do I access GST Portal?",
    answer: "Accessing GST Portal is simple and hassle-free. All you need is an internet connection and a web browser. Just navigate to the website and log in to your account directly from your browser. No software installation is required, making it convenient and accessible from any device.",
  },
  {
    question: "What kind of support is available?",
    answer: "GST Portal offers comprehensive support for its software. Our dedicated support team can assist you with any questions, issues, or technical challenges. We provide timely responses, troubleshooting assistance, and guidance to ensure a smooth experience.",
  },
  {
    question: "How secure is GST Portal?",
    answer: "GST Portal prioritizes the security of its software. We implement industry-standard security measures, including encryption, secure data transmission, and regular security audits, to protect your data and guard against unauthorized access.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              G
            </div>
            <span className="text-xl font-bold">GST Portal</span>
          </div>
          <div className="hidden items-center gap-6 md:flex">
            <Link href="#products" className="text-sm font-medium hover:text-primary">
              Products
            </Link>
            <Link href="#features" className="text-sm font-medium hover:text-primary">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary">
              Pricing
            </Link>
          </div>
          <div className="flex items-center gap-4">
              <div className="hidden items-center gap-2 text-sm md:flex">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Talk to Sales: +91 90321 11788</span>
            </div>
            <Link href={ROUTES.LOGIN}>
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href={ROUTES.REGISTER}>
              <Button>Sign up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background py-16 md:py-24">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }}></div>
        </div>
        <div className="container relative mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <ScrollAnimation delay={0}>
              <div className="mb-6 flex flex-wrap items-center justify-center gap-4">
                <span className="rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary backdrop-blur-sm border border-primary/20 animate-fade-in">
                  GSP Certified
                </span>
                <span className="rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary backdrop-blur-sm border border-primary/20 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                  ISO Certified Company
                </span>
                <span className="rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary backdrop-blur-sm border border-primary/20 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                  GST Suvidha Provider
                </span>
              </div>
            </ScrollAnimation>
            <ScrollAnimation delay={100}>
              <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl animate-fade-in-up">
                Your One-Stop Solution for
                <br />
                <span className="gradient-text animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                  GST Billing, E-Way Bill & E-Invoice
                </span>
              </h1>
            </ScrollAnimation>
            <ScrollAnimation delay={200}>
              <p className="mb-8 text-xl text-muted-foreground md:text-2xl animate-fade-in-up">
                India's Best Accounting, GST Billing & Invoicing Software
              </p>
            </ScrollAnimation>
            <ScrollAnimation delay={300}>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href={ROUTES.REGISTER}>
                  <Button size="lg" className="text-lg px-8 group hover:scale-105 transition-all duration-300 premium-shadow hover:premium-glow">
                    Request Demo
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href={ROUTES.LOGIN}>
                  <Button size="lg" variant="outline" className="text-lg px-8 hover:scale-105 transition-all duration-300">
                    Sign in to Dashboard
                  </Button>
                </Link>
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="border-y bg-muted/30 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollAnimation>
            <div className="mb-8 text-center">
              <p className="text-sm font-semibold text-muted-foreground">
                We already helped 30,000+ Customers across India
              </p>
            </div>
          </ScrollAnimation>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <ScrollAnimation key={index} delay={index * 100}>
                <div className="text-center group">
                  <div className="mb-2 text-3xl font-bold text-primary md:text-4xl transition-all duration-300 group-hover:scale-110 group-hover:text-primary/80">
                    {stat.number}
                  </div>
                  <div className="text-sm text-muted-foreground md:text-base">{stat.label}</div>
                </div>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollAnimation>
            <div className="mb-8 text-center">
              <p className="text-sm font-semibold text-muted-foreground mb-6">
                Trusted by Leading Businesses
              </p>
              <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60">
                {["P&G", "KIA", "IBM", "Hindustan Unilever", "KPMG", "Coca-Cola", "Razorpay", "SBI", "TVS", "Yamaha"].map((company, index) => (
                  <div
                    key={company}
                    className="text-lg font-bold text-muted-foreground hover:opacity-100 hover:scale-110 transition-all duration-300 cursor-default"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {company}
                  </div>
                ))}
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </section>

      {/* Main Products Section */}
      <section id="products" className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollAnimation>
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Complete GST Compliance Solutions
              </h2>
              <p className="text-lg text-muted-foreground">
                All-in-one platform to manage your GST billing, E-Way bills, and E-Invoices
              </p>
            </div>
          </ScrollAnimation>
          <div className="grid gap-8 md:grid-cols-3">
            {mainProducts.map((product, index) => {
              const Icon = product.icon;
              return (
                <ScrollAnimation key={product.title} delay={index * 150}>
                  <Card className="border-2 transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:border-primary/50 group">
                    <CardHeader>
                      <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-lg ${product.bgColor} group-hover:scale-110 transition-transform duration-300 animate-float`} style={{ animationDelay: `${index * 0.2}s` }}>
                        <Icon className={`h-8 w-8 ${product.color} group-hover:rotate-12 transition-transform duration-300`} />
                      </div>
                      <div className="mb-2 text-sm font-semibold text-primary">{product.subtitle}</div>
                      <CardTitle className="text-2xl group-hover:text-primary transition-colors">{product.title}</CardTitle>
                      <CardDescription className="text-base">{product.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href={product.route}>
                        <Button className="w-full group/btn" variant="outline">
                          Explore {product.title}
                          <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </ScrollAnimation>
              );
            })}
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section id="features" className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollAnimation>
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Why Choose GST Portal?
              </h2>
              <p className="text-lg text-muted-foreground">
                Built for Indian businesses, designed for compliance
              </p>
            </div>
          </ScrollAnimation>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <ScrollAnimation key={feature.title} delay={index * 100}>
                  <div className="flex gap-4 p-4 rounded-lg hover:bg-muted/50 transition-all duration-300 group cursor-default">
                    <div className="flex-shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                        <Icon className="h-6 w-6 text-primary group-hover:rotate-12 transition-transform duration-300" />
                      </div>
                    </div>
                    <div>
                      <h3 className="mb-2 text-lg font-semibold group-hover:text-primary transition-colors">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </ScrollAnimation>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-muted/50 py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollAnimation>
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                What Our Customers Say
              </h2>
              <p className="text-lg text-muted-foreground">
                Trusted by thousands of businesses across India
              </p>
            </div>
          </ScrollAnimation>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <ScrollAnimation key={index} delay={index * 150}>
                <Card className="border-2 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-primary/50 group">
                  <CardHeader>
                    <div className="mb-4 flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400 group-hover:scale-110 transition-transform" style={{ transitionDelay: `${i * 0.05}s` }} />
                      ))}
                    </div>
                    <CardDescription className="text-base italic group-hover:text-foreground transition-colors">
                      "{testimonial.content}"
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="font-semibold group-hover:text-primary transition-colors">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.position}</div>
                  </CardContent>
                </Card>
              </ScrollAnimation>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollAnimation>
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-muted-foreground">
                Choose a plan that works for your business
              </p>
            </div>
          </ScrollAnimation>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan], index) => {
              const isPopular = key === "COMBO";
              return (
                <ScrollAnimation key={key} delay={index * 100}>
                  <Card
                    className={`relative transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                      isPopular
                        ? "border-primary border-2 shadow-xl premium-glow"
                        : "border-2 hover:border-primary/50"
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-float">
                        <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-lg">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="group-hover:text-primary transition-colors">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="mt-4">
                        <span className="text-3xl font-bold gradient-text">₹{plan.price.toLocaleString()}</span>
                        <span className="text-muted-foreground">/{plan.duration}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Link href={ROUTES.REGISTER}>
                        <Button
                          className={`w-full group/btn transition-all duration-300 ${
                            isPopular ? "premium-shadow hover:premium-glow" : ""
                          }`}
                          variant={isPopular ? "default" : "outline"}
                        >
                          Get Started
                          <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </ScrollAnimation>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-muted/50 py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
                Frequently Asked Questions
              </h2>
              <p className="text-lg text-muted-foreground">
                Everything you need to know about GST Portal
              </p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index} className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollAnimation>
            <Card className="border-2 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 premium-shadow hover:premium-glow transition-all duration-300 relative overflow-hidden">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 animate-pulse-slow"></div>
              <CardHeader className="text-center relative z-10">
                <CardTitle className="mb-4 text-3xl md:text-4xl animate-fade-in-up">
                  Ready to Simplify Your GST Billing?
                </CardTitle>
                <CardDescription className="text-lg">
                  Join thousands of businesses already using GST Portal
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center gap-4 sm:flex-row relative z-10">
                <Link href={ROUTES.REGISTER}>
                  <Button size="lg" className="text-lg px-8 group hover:scale-105 transition-all duration-300 premium-shadow hover:premium-glow">
                    Request Demo
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground sm:flex-row sm:gap-4">
                  <div className="flex items-center gap-2 hover:text-foreground transition-colors">
                    <Phone className="h-4 w-4" />
                    <span>Sales Team: +91 90321 11788</span>
                  </div>
                  <div className="flex items-center gap-2 hover:text-foreground transition-colors">
                    <Phone className="h-4 w-4" />
                    <span>Support Team: +91 90321 11388</span>
                  </div>
                  <div className="flex items-center gap-2 hover:text-foreground transition-colors">
                    <Mail className="h-4 w-4" />
                    <span>sales@gstportal.in</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollAnimation>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-4 mb-8">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                  G
                </div>
                <span className="text-lg font-bold">GST Portal</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Complete GST billing solution for Indian businesses. GSP certified and ISO certified.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>Sales Team: +91 90321 11788</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Phone className="h-4 w-4" />
                <span>Support Team: +91 90321 11388</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Mail className="h-4 w-4" />
                <span>sales@gstportal.in</span>
              </div>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Products</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href={ROUTES.GST.ROOT} className="hover:text-foreground">
                    GST Billing
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.EWAY.ROOT} className="hover:text-foreground">
                    E-Way Bill
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.EINVOICE.ROOT} className="hover:text-foreground">
                    E-Invoice
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Partners
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    API Docs
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-foreground">
                    Video Tutorials
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8">
            <div className="mb-4 flex flex-col items-center justify-center gap-4 text-sm text-muted-foreground sm:flex-row">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>sales@gstportal.in</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+91 90321 11788</span>
              </div>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <p>© {new Date().getFullYear()} GST Portal. All rights reserved. | GSP Certified | ISO Certified</p>
              <p className="mt-2 text-xs">GST Portal - A product of GST Solutions India Private Limited</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
