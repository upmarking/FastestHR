import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Pin, CalendarDays, Eye } from 'lucide-react';

export default function Announcements() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Company Announcements</h1>
          <p className="text-muted-foreground mt-1">Updates & news across the organization</p>
        </div>
        <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Megaphone className="h-4 w-4" /> NEW_BROADCAST
        </Button>
      </div>

      <div className="max-w-4xl space-y-6">
        {[
          { 
            id: 1, 
            pinned: true,
            title: 'Q2 All-Hands Meeting Schedule Changes', 
            author: 'Sarah Admin (HR Office)',
            date: 'Today, 09:00 AM', 
            views: 142,
            content: "Please be aware that the Q2 All-Hands meeting has been rescheduled to Thursday at 2:00 PM EST. The zoom link remains the same. Check your calendar for the updated invitation.",
            department: 'All Company'
          },
          { 
            id: 2, 
            pinned: false,
            title: 'New Benefits Enrollment Period Open', 
            author: 'Jane Doe (Benefits Admin)',
            date: 'Mar 12, 2026', 
            views: 315,
            content: "The annual benefits enrollment period is now open and will close on March 31st. Please log in to the portal to make your selections for the upcoming year. Reach out to HR if you have any questions.",
            department: 'All Company'
          },
          { 
            id: 3, 
            pinned: false,
            title: 'Welcome our new Engineering Lead!', 
            author: 'Mark Smith (VP Engineering)',
            date: 'Mar 10, 2026', 
            views: 89,
            content: "We're excited to welcome Alex Rivera to the engineering team! Alex joins us with over 10 years of experience in distributed systems. He will be leading the infrastructure pod starting next Monday.",
            department: 'Engineering'
          }
        ].map(ann => (
          <Card key={ann.id} className={`shadow-none overflow-hidden relative ${ann.pinned ? 'border-primary/60 bg-primary/5' : 'border-border/50 bg-card/40'}`}>
            {ann.pinned && (
              <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                <div className="absolute -rotate-45 transform bg-primary text-primary-foreground text-[10px] font-bold uppercase py-1 right-[-35px] top-[15px] w-[120px] text-center shadow-lg">
                  Pinned
                </div>
              </div>
            )}
            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded bg-background border ${ann.pinned ? 'border-primary' : 'border-border/50'} flex items-center justify-center flex-shrink-0`}>
                  {ann.pinned ? <Pin className="w-6 h-6 text-primary" /> : <Megaphone className="w-6 h-6 text-muted-foreground" />}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1 pr-14">
                    <CardTitle className={`text-lg hover:text-primary transition-colors cursor-pointer ${ann.pinned ? 'text-primary' : ''}`}>
                      {ann.title}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-medium uppercase border-border/50 bg-background/50 text-muted-foreground">
                      {ann.department}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>By {ann.author}</span>
                    <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> {ann.date}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/80 leading-relaxed border-l-2 border-border/50 pl-4 py-1">
                {ann.content}
              </p>
            </CardContent>
            <CardFooter className="pt-0 pb-4 flex justify-between items-center text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {ann.views} Seen</span>
              <Button variant="ghost" size="sm" className="h-auto py-1 px-3 text-primary hover:text-primary hover:bg-primary/10">READ_MORE</Button>
            </CardFooter>
          </Card>
        ))}
        
        <div className="flex justify-center mt-8">
          <Button variant="outline" className="border-border/50 text-muted-foreground mt-1 uppercase text-xs w-full max-w-xs hover:bg-primary/10 hover:text-primary">
            LOAD_OLDER_TRANSMISSIONS
          </Button>
        </div>
      </div>
    </div>
  );
}
