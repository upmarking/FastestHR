import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Building, Bell, Shield, KeyIcon, Users } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function Settings() {
  const { profile } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');

  const { data: company, isLoading } = useQuery({
    queryKey: ['my-company', profile?.company_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile!.company_id!)
        .maybeSingle();
      return data;
    },
    enabled: !!profile?.company_id,
  });

  const [form, setForm] = useState({ name: '', timezone: '', currency: '', country: '' });

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name || '',
        timezone: company.timezone || 'UTC',
        currency: company.currency || 'USD',
        country: company.country || '',
      });
    }
  }, [company]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('companies')
        .update({
          name: form.name,
          timezone: form.timezone,
          currency: form.currency,
          country: form.country,
        })
        .eq('id', profile!.company_id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-company'] });
      toast.success('Settings saved successfully');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to save settings');
    },
  });

  const menuItems = [
    { id: 'general', label: 'General Info', icon: Building },
    { id: 'roles', label: 'Roles & Permissions', icon: Shield },
    { id: 'schedule', label: 'Work Schedule', icon: Calendar },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security & SSO', icon: KeyIcon },
    { id: 'integrations', label: 'Integrations', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Company Settings</h1>
          <p className="text-muted-foreground mt-1">Configuration & preferences</p>
        </div>
        <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6 items-start">
        <Card className="overflow-hidden col-span-1">
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="text-base">Menu</CardTitle>
          </CardHeader>
          <div className="flex flex-col py-2">
            {menuItems.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-3 px-6 py-3 cursor-pointer transition-colors ${
                  activeTab === item.id
                    ? 'bg-primary/10 border-l-2 border-l-primary text-primary'
                    : 'hover:bg-primary/5 text-muted-foreground hover:text-foreground border-l-2 border-l-transparent'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Building className="w-5 h-5" /> General Information
            </CardTitle>
            <CardDescription>Update your company details and global settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Company Name</label>
                  <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="bg-background/50 border-border/50 text-sm h-10" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Country</label>
                  <Input value={form.country} onChange={(e) => setForm(f => ({ ...f, country: e.target.value }))} className="bg-background/50 border-border/50 text-sm h-10" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Default Timezone</label>
                  <select
                    value={form.timezone}
                    onChange={(e) => setForm(f => ({ ...f, timezone: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase">Primary Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm(f => ({ ...f, currency: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-border/50">
              <h3 className="text-lg font-semibold mb-4">Company Logo</h3>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-lg bg-background border-2 border-dashed border-primary/40 flex items-center justify-center text-primary/40 hover:text-primary hover:border-primary transition-colors cursor-pointer">
                  {company?.logo_url ? (
                    <img src={company.logo_url} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Building className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <p className="text-sm mb-1">Upload a new logo</p>
                  <p className="text-xs text-muted-foreground mb-3">Max file size 2MB. Recommended 256x256 px.</p>
                  <Button variant="outline" size="sm" className="text-xs h-8">Choose File</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
