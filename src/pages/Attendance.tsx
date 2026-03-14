import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Play, Square, Coffee } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function Attendance() {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: attendanceData = [], isLoading } = useQuery({
    queryKey: ['attendance'],
    queryFn: async () => {
      const { data } = await supabase
        .from('attendance')
        .select(`*, employees (first_name, last_name)`)
        .order('date', { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  const handleClockIn = () => toast.success("Clocked in successfully");
  const handleClockOut = () => toast.success("Clocked out successfully");
  const handleBreak = () => toast.info("Break initiated");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Tracking</h1>
          <p className="text-muted-foreground mt-1">Real-time attendance & timesheet management</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <CardHeader className="border-b border-border/50 pb-4 relative z-10">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Current Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 relative z-10">
            <div className="text-center">
              <div className="text-6xl font-display font-bold tracking-tight mb-2 text-foreground">
                {currentTime.toLocaleTimeString('en-US', { hour12: false })}
              </div>
              <p className="text-muted-foreground text-sm font-medium">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            
            <div className="flex justify-center gap-4">
              <Button size="lg" className="w-32 bg-success text-success-foreground hover:bg-success/90" onClick={handleClockIn}>
                <Play className="w-5 h-5 mr-2" /> Clock In
              </Button>
              <Button size="lg" variant="outline" className="w-32 border-warning text-warning hover:bg-warning/10" onClick={handleBreak}>
                <Coffee className="w-5 h-5 mr-2" /> Break
              </Button>
              <Button size="lg" variant="outline" className="w-32 border-destructive text-destructive hover:bg-destructive/10" onClick={handleClockOut}>
                <Square className="w-5 h-5 mr-2" /> Clock Out
              </Button>
            </div>
            
            <div className="pt-4 border-t border-border/50 flex justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" /> <span>IP: 192.168.1.104</span>
              </div>
              <div className="font-medium text-foreground">Total: <span className="text-primary">05:42:10</span></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Weekly Summary</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4 text-sm">
              {[
                { day: 'Mon', status: 'Present', hrs: '08:15', color: 'success' },
                { day: 'Tue', status: 'Present', hrs: '08:02', color: 'success' },
                { day: 'Wed', status: 'Present', hrs: '08:45', color: 'success' },
                { day: 'Thu', status: 'Leave', hrs: '00:00', color: 'warning' },
                { day: 'Fri', status: 'Active', hrs: '05:42', color: 'info' },
              ].map(d => (
                <div key={d.day} className="flex justify-between items-center p-2 rounded border border-border/50 bg-background/50">
                  <span className="w-10 text-muted-foreground font-medium">{d.day}</span>
                  <Badge variant="outline" className={`border-${d.color} text-${d.color} bg-${d.color}/10 w-20 justify-center`}>
                    {d.status}
                  </Badge>
                  <span className="text-right w-12 font-medium">{d.hrs}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle>Recent Logs</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
            {isLoading ? <p className="text-muted-foreground py-4 text-center">Loading Data...</p> : attendanceData.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center">No recent records found.</p>
            ) : (
                <div className="divide-y divide-border/50">
                  {attendanceData.map((record: any) => (
                    <div key={record.id} className="py-3 flex justify-between items-center text-sm hover:bg-muted/30 p-2 rounded-lg transition-colors">
                      <div>
                        <div className="font-semibold text-foreground">
                          {(record.employees as any)?.first_name} {(record.employees as any)?.last_name}
                        </div>
                        <div className="text-muted-foreground text-xs">{record.date}</div>
                      </div>
                      <div className="flex gap-4 text-right">
                        <div>
                          <span className="text-muted-foreground text-xs uppercase block">In</span>
                          {record.clock_in ? new Date(record.clock_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs uppercase block">Out</span>
                          {record.clock_out ? new Date(record.clock_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                        </div>
                        <div className="w-16">
                          <span className="text-muted-foreground text-xs uppercase block">Total</span>
                          {record.total_hours?.toFixed(2) || '0.00'}h
                        </div>
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
