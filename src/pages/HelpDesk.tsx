import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Plus, LifeBuoy, Clock, MessageSquare, AlertCircle } from 'lucide-react';

export default function HelpDesk() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">IT & HR Help Desk</h1>
          <p className="text-muted-foreground mt-1">Service requests & issue tracking</p>
        </div>
        <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> RAISE_TICKET
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Open Tickets', value: '3', color: 'text-warning' },
          { label: 'In Progress', value: '1', color: 'text-info' },
          { label: 'Resolved (7d)', value: '12', color: 'text-success' },
          { label: 'SLA Breached', value: '0', color: 'text-destructive' },
        ].map(stat => (
          <Card key={stat.label} className="overflow-hidden">
            <CardContent className="p-4 flex items-center justify-between">
              <h3 className="text-xs font-medium text-muted-foreground uppercase">{stat.label}</h3>
              <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border/50 pb-4">
          <div>
            <CardTitle className="flex items-center text-foreground font-semibold gap-2">
              <LifeBuoy className="w-5 h-5" /> ACTIVE_TICKETS
            </CardTitle>
            <CardDescription className="mt-1">Manage your support requests</CardDescription>
          </div>
          <div className="w-full sm:w-64 mt-4 sm:mt-0 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="SEARCH_TICKETS..."
              className="pl-8 bg-background/50 border-primary/50 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-primary/10">
            {[
              { id: 'TKT-1042', subject: 'VPN Access Denied', category: 'IT Support', priority: 'High', status: 'Open', lastUpdated: '2h ago' },
              { id: 'TKT-1039', subject: 'Payroll Discrepancy (Feb)', category: 'HR / Payroll', priority: 'Medium', status: 'In Progress', lastUpdated: '1d ago' },
              { id: 'TKT-1025', subject: 'Requesting new monitor', category: 'Assets', priority: 'Low', status: 'Pending Approval', lastUpdated: '3d ago' },
            ].map(ticket => (
              <div key={ticket.id} className="p-4 hover:bg-primary/5 transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 p-2 rounded-full ${
                    ticket.priority === 'High' ? 'bg-destructive/10 text-destructive' :
                    ticket.priority === 'Low' ? 'bg-info/10 text-info' :
                    'bg-warning/10 text-warning'
                  }`}>
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">{ticket.id}</span>
                      <h4 className="font-medium text-sm group-hover:text-primary transition-colors">{ticket.subject}</h4>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-medium text-muted-foreground uppercase">
                      <span>{ticket.category}</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Updated {ticket.lastUpdated}</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> 2 replies</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                  <Badge variant="outline" className={`font-mono uppercase text-[10px] ${
                    ticket.status === 'Open' ? 'border-primary text-primary bg-primary/10' :
                    ticket.status === 'In Progress' ? 'border-info text-info bg-info/10' :
                    'border-warning text-warning bg-warning/10'
                  }`}>
                    {ticket.status}
                  </Badge>
                  <Button variant="ghost" size="sm" className="text-xs font-medium text-muted-foreground hover:text-primary">
                    VIEW
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
