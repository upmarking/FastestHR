import { Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Zap className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold">FastestHR</h1>
      </div>
      <p className="mb-8 max-w-md text-center text-lg text-muted-foreground">
        The fastest way to manage your workforce. Streamline HR, payroll, attendance, and more.
      </p>
      <div className="flex gap-3">
        <Button asChild size="lg">
          <Link to="/register">Get Started Free</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/login">Sign In</Link>
        </Button>
      </div>
    </div>
  );
};

export default Index;
