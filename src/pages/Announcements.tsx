import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Megaphone, Pin, CalendarDays, Eye } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function Announcements() {
  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Company Announcements</h1>
          <p className="text-muted-foreground mt-1">Updates & news across the organization</p>
        </div>
        <Button className="gap-2">
          <Megaphone className="h-4 w-4" /> New Announcement
        </Button>
      </div>

      <div className="max-w-4xl space-y-6">
        {isLoading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full" />)
        ) : announcements.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-16">
              <Megaphone className="h-16 w-16 text-muted-foreground/30" />
              <div className="text-center">
                <p className="text-lg font-medium">No announcements yet</p>
                <p className="text-sm text-muted-foreground">Create your first announcement to share with the team</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          announcements.map((ann: any) => (
            <Card key={ann.id} className={`shadow-none overflow-hidden relative ${ann.is_pinned ? 'border-primary/60 bg-primary/5' : 'border-border/50 bg-card/40'}`}>
              {ann.is_pinned && (
                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                  <div className="absolute -rotate-45 transform bg-primary text-primary-foreground text-[10px] font-bold uppercase py-1 right-[-35px] top-[15px] w-[120px] text-center shadow-lg">
                    Pinned
                  </div>
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded bg-background border ${ann.is_pinned ? 'border-primary' : 'border-border/50'} flex items-center justify-center flex-shrink-0`}>
                    {ann.is_pinned ? <Pin className="w-6 h-6 text-primary" /> : <Megaphone className="w-6 h-6 text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1 pr-14">
                      <CardTitle className={`text-lg ${ann.is_pinned ? 'text-primary' : ''}`}>
                        {ann.title}
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px] uppercase border-border/50 bg-background/50 text-muted-foreground">
                        {ann.target_audience || 'All'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" /> {new Date(ann.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              {ann.content && (
                <CardContent>
                  <p className="text-sm text-foreground/80 leading-relaxed border-l-2 border-border/50 pl-4 py-1">
                    {ann.content}
                  </p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
