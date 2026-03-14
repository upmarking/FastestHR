import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Leave() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Leave Management</h1>
          <p className="text-muted-foreground mt-1">Time-off requests & balances</p>
        </div>
        <Button onClick={() => navigate('/leave/apply')} className="gap-2">
          <Plus className="h-4 w-4" /> APPLY_LEAVE
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { type: 'Casual Leave', total: 10, used: 2, color: 'text-primary' },
          { type: 'Sick Leave', total: 8, used: 0, color: 'text-warning' },
          { type: 'Earned Leave', total: 12, used: 5, color: 'text-success' },
          { type: 'Optional Holiday', total: 2, used: 0, color: 'text-info' },
        ].map(l => (
          <Card key={l.type} className="overflow-hidden">
            <CardContent className="p-6">
              <h3 className="text-sm text-muted-foreground mb-4 uppercase">{l.type}</h3>
              <div className="flex items-end justify-between">
                <div className={`text-4xl font-bold ${l.color}`}>
                  {l.total - l.used}
                </div>
                <div className="text-sm text-muted-foreground pb-1">
                  / {l.total} REMAINING
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center text-foreground font-semibold gap-2">
            <Calendar className="w-5 h-5" /> RECENT_REQUESTS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { id: 1, type: 'Casual Leave', date: 'Mar 18, 2026', days: 1, status: 'approved', icon: CheckCircle, color: 'text-success' },
              { id: 2, type: 'Sick Leave', date: 'Mar 10 - Mar 11, 2026', days: 2, status: 'rejected', icon: XCircle, color: 'text-destructive' },
              { id: 3, type: 'Earned Leave', date: 'Apr 02 - Apr 05, 2026', days: 4, status: 'pending', icon: Clock, color: 'text-warning' },
            ].map(req => (
              <div key={req.id} className="flex items-center justify-between p-4 rounded-lg bg-background/40 border border-border/50">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full bg-background ${req.color} shadow-[0_0_10px_currentColor] border border-current`}>
                    <req.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-primary">{req.type}</h4>
                    <p className="text-sm text-muted-foreground">{req.date} &bull; {req.days} Day{req.days > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <Badge variant="outline" className={`font-mono uppercase tracking-wider ${
                  req.status === 'approved' ? 'border-success text-success bg-success/10' :
                  req.status === 'rejected' ? 'border-destructive text-destructive bg-destructive/10' :
                  'border-warning text-warning bg-warning/10'
                }`}>
                  {req.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
