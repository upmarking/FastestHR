import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Settings2, Terminal, ShieldAlert, Cpu } from 'lucide-react';

export default function SystemSettings() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">System Settings</h1>
          <p className="text-muted-foreground mt-1">SuperAdmin - Platform-wide configuration</p>
        </div>
        <Button className="gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90">
          <Terminal className="h-4 w-4" /> RESTART_SERVICES
        </Button>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground font-semibold gap-2 text-base">
              <Settings2 className="w-5 h-5" /> GLOBAL_FEATURE_FLAGS
            </CardTitle>
            <CardDescription className="text-[10px] font-medium uppercase tracking-wider">Enable or disable modules across all tenants</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { id: 'flag-ats', label: 'Recruitment (ATS) Engine', desc: 'Allow companies to use applicant tracking module', enabled: true },
              { id: 'flag-payroll', label: 'Advanced Payroll Engine', desc: 'Enable external integrations for payroll processing', enabled: true },
              { id: 'flag-learning', label: 'Learning & Development', desc: 'Beta: Course catalog and video streaming', enabled: false },
              { id: 'flag-ai', label: 'AI Insights Module', desc: 'Generative AI for performance reviews and screening', enabled: false },
            ].map(flag => (
              <div key={flag.id} className="flex items-center justify-between p-4 rounded bg-background/50 border border-border/50">
                <div className="space-y-1 mr-4">
                  <h4 className="text-sm font-medium">{flag.label}</h4>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase">{flag.desc}</p>
                </div>
                <Switch defaultChecked={flag.enabled} className="data-[state=checked]:bg-primary" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center text-foreground font-semibold gap-2 text-base">
              <ShieldAlert className="w-5 h-5" /> SECURITY_POLICIES
            </CardTitle>
            <CardDescription className="text-[10px] font-medium uppercase tracking-wider">Platform-wide enforcement rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded bg-background/50 border border-border/50">
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-warning">Force MFA for All SuperAdmins</h4>
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Requires immediate re-authentication</p>
              </div>
              <Switch defaultChecked={true} disabled />
            </div>
            
            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-medium text-muted-foreground uppercase">Max Failed Login Attempts</label>
              <div className="flex items-center gap-4">
                <Input type="number" defaultValue={5} className="w-24 bg-background/50 text-sm border-border/50" />
                <span className="text-xs font-medium text-muted-foreground">Accounts will be locked for 15 minutes</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-medium text-muted-foreground uppercase">Session Timeout (Minutes)</label>
              <div className="flex items-center gap-4">
                <Input type="number" defaultValue={120} className="w-24 bg-background/50 text-sm border-border/50" />
                <span className="text-xs font-medium text-muted-foreground">Inactivity threshold before auto-logout</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader className="bg-primary/5 border-b border-border/50">
            <CardTitle className="flex items-center text-foreground font-semibold gap-2 text-base">
              <Cpu className="w-5 h-5" /> SYSTEM_HEALTH
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-sm">
            <div className="divide-y divide-border/50">
              <div className="p-4 flex flex-wrap gap-4 justify-between items-center hover:bg-primary/5">
                <div className="w-32 text-muted-foreground uppercase text-[10px]">Database (PostgreSQL)</div>
                <div className="flex-1 text-success flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-success shadow-[0_0_5px_currentColor]"></div> Operational</div>
                <div className="w-32 text-right">0.8ms latency</div>
              </div>
              <div className="p-4 flex flex-wrap gap-4 justify-between items-center hover:bg-primary/5">
                <div className="w-32 text-muted-foreground uppercase text-[10px]">Redis Cache</div>
                <div className="flex-1 text-success flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-success shadow-[0_0_5px_currentColor]"></div> Operational</div>
                <div className="w-32 text-right">0.2ms latency</div>
              </div>
              <div className="p-4 flex flex-wrap gap-4 justify-between items-center hover:bg-primary/5">
                <div className="w-32 text-muted-foreground uppercase text-[10px]">Storage (S3)</div>
                <div className="flex-1 text-success flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-success shadow-[0_0_5px_currentColor]"></div> Operational</div>
                <div className="w-32 text-right">15.4ms latency</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
