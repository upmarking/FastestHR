import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, LifeBuoy, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

export default function HelpDesk() {
  const [search, setSearch] = useState('');

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets', search],
    queryFn: async () => {
      let query = supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (search) {
        query = query.or(`subject.ilike.%${search}%,ticket_number.ilike.%${search}%`);
      }

      const { data } = await query;
      return data || [];
    },
  });

  const openCount = tickets.filter((t: any) => t.status === 'open').length;
  const inProgressCount = tickets.filter((t: any) => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter((t: any) => t.status === 'resolved' || t.status === 'closed').length;

  const priorityStyle: Record<string, string> = {
    high: 'bg-destructive/10 text-destructive',
    critical: 'bg-destructive/10 text-destructive',
    medium: 'bg-warning/10 text-warning',
    low: 'bg-info/10 text-info',
  };

  const statusStyle: Record<string, string> = {
    open: 'border-primary text-primary bg-primary/10',
    in_progress: 'border-info text-info bg-info/10',
    pending_reply: 'border-warning text-warning bg-warning/10',
    resolved: 'border-success text-success bg-success/10',
    closed: 'border-muted text-muted-foreground',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IT & HR Help Desk</h1>
          <p className="text-muted-foreground mt-1">Service requests & issue tracking</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Raise Ticket
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Open Tickets', value: openCount, color: 'text-warning' },
          { label: 'In Progress', value: inProgressCount, color: 'text-info' },
          { label: 'Resolved', value: resolvedCount, color: 'text-success' },
          { label: 'Total', value: tickets.length, color: 'text-foreground' },
        ].map(stat => (
          <Card key={stat.label}>
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
            <CardTitle className="flex items-center gap-2">
              <LifeBuoy className="w-5 h-5" /> Tickets
            </CardTitle>
            <CardDescription className="mt-1">Manage support requests</CardDescription>
          </div>
          <div className="w-full sm:w-64 mt-4 sm:mt-0 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tickets..."
              className="pl-8 bg-background/50 border-border/50 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <LifeBuoy className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No tickets found</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {tickets.map((ticket: any) => (
                <div key={ticket.id} className="p-4 hover:bg-muted/30 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 p-2 rounded-full ${priorityStyle[ticket.priority] || 'bg-muted/10 text-muted-foreground'}`}>
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground">{ticket.ticket_number}</span>
                        <h4 className="font-medium text-sm">{ticket.subject}</h4>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase">
                        <span>{ticket.category}</span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className={`text-[10px] uppercase ${statusStyle[ticket.status] || ''}`}>
                      {ticket.status?.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
