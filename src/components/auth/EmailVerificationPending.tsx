import { useState, useEffect, useCallback } from 'react';
import { Mail, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmailVerificationPendingProps {
  email: string;
  onBackToLogin?: () => void;
}

const COOLDOWN_SECONDS = 180;
const STORAGE_KEY = 'fastesthr_resend_ts';

function getRemainingCooldown(): number {
  const lastSent = localStorage.getItem(STORAGE_KEY);
  if (!lastSent) return 0;
  const elapsed = Math.floor((Date.now() - parseInt(lastSent, 10)) / 1000);
  return Math.max(0, COOLDOWN_SECONDS - elapsed);
}

export function EmailVerificationPending({ email, onBackToLogin }: EmailVerificationPendingProps) {
  const [cooldown, setCooldown] = useState(() => getRemainingCooldown());
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      const remaining = getRemainingCooldown();
      setCooldown(remaining);
      if (remaining <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleResend = useCallback(async () => {
    if (cooldown > 0 || sending) return;
    setSending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
      setCooldown(COOLDOWN_SECONDS);
      setSent(true);
      toast.success('Verification email sent!');
      setTimeout(() => setSent(false), 3000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend email');
    } finally {
      setSending(false);
    }
  }, [cooldown, sending, email]);

  return (
    <div className="flex flex-col items-center text-center gap-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Mail className="h-8 w-8 text-primary" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Verify your email</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          We sent a verification link to{' '}
          <span className="font-medium text-foreground">{email}</span>.
          Please check your inbox and click the link to activate your account.
        </p>
      </div>

      <div className="w-full max-w-xs space-y-3">
        <Button
          variant="outline"
          className="w-full gap-2"
          disabled={cooldown > 0 || sending}
          onClick={handleResend}
        >
          {sending ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : sent ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {cooldown > 0
            ? `Resend in ${formatTime(cooldown)}`
            : sending
              ? 'Sending...'
              : sent
                ? 'Sent!'
                : 'Resend verification email'}
        </Button>

        <p className="text-xs text-muted-foreground">
          Didn't receive it? Check your spam folder or try resending.
        </p>
      </div>

      {onBackToLogin && (
        <Button variant="ghost" size="sm" onClick={onBackToLogin} className="text-muted-foreground">
          ← Back to login
        </Button>
      )}
    </div>
  );
}
