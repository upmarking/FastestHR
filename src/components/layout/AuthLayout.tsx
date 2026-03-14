import { Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/20">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-2xl font-bold">FastestHR</span>
        </Link>
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            The fastest way to<br />manage your workforce.
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/70">
            Streamline HR operations, payroll, attendance, and more — all in one platform.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/50">© 2026 FastestHR. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 lg:p-12">
        <div className="flex w-full max-w-md flex-col gap-6 lg:hidden">
          <Link to="/" className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold">FastestHR</span>
          </Link>
        </div>
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
