import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, BarChart3, LineChart, Download, Filter } from 'lucide-react';

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Data visualization & export</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 border-border/50 text-muted-foreground hover:text-primary">
            <Filter className="h-4 w-4" /> FILTER_DATA
          </Button>
          <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Download className="h-4 w-4" /> EXPORT_ALL
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Headcount Report */}
        <Card className="overflow-hidden col-span-1 lg:col-span-2">
          <CardHeader className="border-b border-border/50 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center text-foreground font-semibold gap-2 text-base">
              <BarChart3 className="w-5 h-5" /> HEADCOUNT_BY_DEPARTMENT
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs font-medium text-muted-foreground"><Download className="w-3 h-3 mr-1" /> PDF</Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64 flex items-end gap-4">
              {/* Fake Bar Chart */}
              {[ 
                { dept: 'Engineering', count: 42, color: 'bg-primary' },
                { dept: 'Sales', count: 28, color: 'bg-info' },
                { dept: 'Marketing', count: 15, color: 'bg-success' },
                { dept: 'HR & Ops', count: 8, color: 'bg-warning' },
                { dept: 'Product', count: 12, color: 'bg-secondary' },
              ].map(bar => (
                <div key={bar.dept} className="flex-1 flex flex-col items-center justify-end h-full gap-2 relative group">
                  <div className="flex flex-col items-center absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-medium bg-background border border-border/50 px-2 py-1 rounded shadow-lg z-10">{bar.count} Emp.</span>
                  </div>
                  <div 
                    className={`w-full max-w-[40px] ${bar.color} rounded-t-sm bg-opacity-80 hover:bg-opacity-100 transition-all cursor-pointer`} 
                    style={{ height: `${(bar.count / 42) * 100}%` }}
                  ></div>
                  <span className="text-[10px] font-medium text-muted-foreground text-center line-clamp-1 w-full uppercase">{bar.dept}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Attrition Report */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center text-foreground font-semibold gap-2 text-base">
              <PieChart className="w-5 h-5" /> EMPLOYMENT_TYPE
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col justify-center h-[calc(100%-65px)]">
            <div className="relative w-48 h-48 mx-auto rounded-full border-8 border-border/50 flex items-center justify-center">
              {/* Fake Donut SVG logic could go here, for now simple representation */}
              <div className="absolute inset-0 rounded-full border-8 border-success" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 0 70%)' }}></div>
              <div className="absolute inset-0 rounded-full border-8 border-warning" style={{ clipPath: 'polygon(100% 70%, 100% 100%, 60% 100%, 60% 70%)' }}></div>
              <div className="absolute inset-0 rounded-full border-8 border-info" style={{ clipPath: 'polygon(0 70%, 60% 70%, 60% 100%, 0 100%)' }}></div>
              
              <div className="text-center z-10 bg-background/80 backdrop-blur w-32 h-32 rounded-full flex flex-col items-center justify-center border border-border/50">
                <span className="text-3xl font-bold text-foreground font-semibold">105</span>
                <span className="text-[10px] text-muted-foreground uppercase">Total Staff</span>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-success rounded-full"></div><span className="text-xs font-medium text-muted-foreground">Full-time (70%)</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-warning rounded-full"></div><span className="text-xs font-medium text-muted-foreground">Contract (20%)</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-info rounded-full"></div><span className="text-xs font-medium text-muted-foreground">Part-time (10%)</span></div>
            </div>
          </CardContent>
        </Card>

        {/* Payroll Cost Trend */}
        <Card className="overflow-hidden col-span-1 lg:col-span-3">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center text-foreground font-semibold gap-2 text-base">
              <LineChart className="w-5 h-5" /> PAYROLL_COST_TREND (YTD)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
             <div className="h-48 border-l border-b border-border/50 flex items-end gap-1 relative px-2 pt-4">
               {/* Y Axis Labels */}
               <div className="absolute left-[-40px] top-0 bottom-0 flex flex-col justify-between text-[10px] font-medium text-muted-foreground py-2 h-full pr-2 items-end">
                 <span>$150k</span>
                 <span>$100k</span>
                 <span>$50k</span>
                 <span>$0</span>
               </div>
               
               {/* X Axis & Chart Line Similation */}
               <div className="w-full flex justify-between h-full items-end pb-2">
                 {[ 
                   { m: 'Jan', val: 30 }, { m: 'Feb', val: 35 }, { m: 'Mar', val: 40 }, 
                   { m: 'Apr', val: 38 }, { m: 'May', val: 55 }, { m: 'Jun', val: 60 },
                   { m: 'Jul', val: 62 }, { m: 'Aug', val: 65 }, { m: 'Sep', val: 70 },
                   { m: 'Oct', val: 75 }, { m: 'Nov', val: 80 }, { m: 'Dec', val: 95 }
                 ].map((pt, i) => (
                   <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                     <div 
                       className="w-2 bg-primary/50 relative rounded-t"
                       style={{ height: `${pt.val}%` }}
                     >
                       <div className="absolute top-0 right-1/2 translate-x-1/2 w-4 h-4 bg-background border-2 border-primary rounded-full z-10 shadow-[0_0_5px_var(--primary)]"></div>
                     </div>
                     <span className="text-[10px] font-medium text-muted-foreground mt-4 translate-y-2">{pt.m}</span>
                   </div>
                 ))}
               </div>
               
               {/* Grid Lines */}
               <div className="absolute inset-0 pointer-events-none flex flex-col justify-between pt-4 pb-2 border-b border-transparent">
                 <div className="w-full h-[1px] bg-primary/10"></div>
                 <div className="w-full h-[1px] bg-primary/10"></div>
                 <div className="w-full h-[1px] bg-primary/10"></div>
                 <div className="w-full h-[1px] bg-transparent"></div>
               </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
