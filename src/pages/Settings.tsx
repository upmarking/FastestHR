import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Building, Bell, Shield, KeyIcon, Users } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

export default function Settings() {
  const { user } = useAuthStore();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Company Settings</h1>
          <p className="text-muted-foreground mt-1">Configuration & preferences</p>
        </div>
        <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          SAVE_CHANGES
        </Button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6 items-start">
        <Card className="overflow-hidden col-span-1 border-r border-r-primary/20 rounded-none lg:rounded-lg">
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="text-foreground font-semibold text-base">MENU</CardTitle>
          </CardHeader>
          <div className="flex flex-col py-2">
            {[
              { label: 'General Info', icon: Building, active: true },
              { label: 'Roles & Permissions', icon: Shield, active: false },
              { label: 'Work Schedule', icon: Calendar, active: false },
              { label: 'Notifications', icon: Bell, active: false },
              { label: 'Security & SSO', icon: KeyIcon, active: false },
              { label: 'Integrations', icon: Users, active: false },
            ].map((item, i) => (
               <div 
                key={i} 
                className={`flex items-center gap-3 px-6 py-3 cursor-pointer transition-colors ${
                  item.active ? 'bg-primary/10 border-l-2 border-l-primary text-primary' : 'hover:bg-primary/5 text-muted-foreground hover:text-foreground border-l-2 border-l-transparent'
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
            <CardTitle className="flex items-center text-foreground font-semibold gap-2 text-xl">
              <Building className="w-5 h-5" /> GENERAL_INFORMATION
            </CardTitle>
            <CardDescription className="text-sm">Update your company details and global settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase">Company Name</label>
                <Input defaultValue="Acme Corp International" className="bg-background/50 border-border/50 text-sm h-10" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase">Legal Entity / Tax ID</label>
                <Input defaultValue="TX-9876543210" className="bg-background/50 border-border/50 text-sm h-10" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase">Default Timezone</label>
                <select className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option>America/New_York (EST)</option>
                  <option>America/Los_Angeles (PST)</option>
                  <option>Europe/London (GMT)</option>
                  <option>Asia/Kolkata (IST)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase">Primary Currency</label>
                <select className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground">
                  <option>USD ($)</option>
                  <option>EUR (€)</option>
                  <option>GBP (£)</option>
                  <option>INR (₹)</option>
                </select>
              </div>
            </div>
            
            <div className="pt-6 border-t border-border/50">
              <h3 className="text-lg text-foreground font-semibold mb-4">Company Logo</h3>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-lg bg-background border-2 border-dashed border-primary/40 flex items-center justify-center text-primary/40 hover:text-primary hover:border-primary transition-colors cursor-pointer">
                  <Building className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm text-foreground mb-1">Upload a new logo</p>
                  <p className="text-xs font-medium text-muted-foreground mb-3">Max file size 2MB. Recommended 256x256 px.</p>
                  <Button variant="outline" size="sm" className="text-xs font-medium h-8 border-primary/50 hover:bg-primary/10 hover:text-primary">CHOOSE_FILE</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
