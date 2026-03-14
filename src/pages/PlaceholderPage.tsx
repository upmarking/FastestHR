import { Card, CardContent } from '@/components/ui/card';
import { Construction } from 'lucide-react';

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16">
          <Construction className="h-16 w-16 text-muted-foreground/30" />
          <div className="text-center">
            <p className="text-lg font-medium">Coming Soon</p>
            <p className="text-sm text-muted-foreground">This module is under development</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
