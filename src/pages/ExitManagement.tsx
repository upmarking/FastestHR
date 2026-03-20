import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserMinus, ClipboardCheck, DollarSign, MessageSquare, Package, Plus, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import { useState } from 'react';
import { toast } from 'sonner';

interface ExitRecord {
  id: string;
  employeeName: string;
  department: string;
  resignationDate: string;
  lastWorkingDay: string;
  reason: string;
  status: 'initiated' | 'in_progress' | 'completed';
  exitInterview: boolean;
  assetsReturned: boolean;
  settlementDone: boolean;
}

const assetChecklist = [
  'Laptop / Desktop',
  'ID Card / Access Card',
  'Company Phone',
  'Parking Pass',
  'Keys / Locks',
  'Credit Card',
  'Uniforms',
  'Books / Documents',
];

export default function ExitManagement() {
  const { profile } = useAuthStore();
  const isAdmin = profile?.platform_role === 'company_admin' || profile?.platform_role === 'super_admin';

  const [exits, setExits] = useState<ExitRecord[]>([
    { id: '1', employeeName: 'John Smith', department: 'Engineering', resignationDate: '2026-03-01', lastWorkingDay: '2026-03-31', reason: 'Better opportunity', status: 'in_progress', exitInterview: true, assetsReturned: false, settlementDone: false },
    { id: '2', employeeName: 'Sarah Johnson', department: 'Marketing', resignationDate: '2026-02-15', lastWorkingDay: '2026-03-15', reason: 'Personal reasons', status: 'completed', exitInterview: true, assetsReturned: true, settlementDone: true },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ employeeName: '', department: '', resignationDate: '', lastWorkingDay: '', reason: '' });
  const [selectedExit, setSelectedExit] = useState<string | null>(null);
  const [assetState, setAssetState] = useState<Record<string, boolean[]>>({});

  const getAssetChecks = (exitId: string) => assetState[exitId] || assetChecklist.map(() => false);
  const toggleAsset = (exitId: string, idx: number) => {
    setAssetState(prev => {
      const current = prev[exitId] || assetChecklist.map(() => false);
      const updated = [...current];
      updated[idx] = !updated[idx];
      return { ...prev, [exitId]: updated };
    });
  };

  const handleCreate = () => {
    if (!form.employeeName.trim()) { toast.error('Employee name is required'); return; }
    const newExit: ExitRecord = {
      id: Date.now().toString(),
      ...form,
      status: 'initiated',
      exitInterview: false,
      assetsReturned: false,
      settlementDone: false,
    };
    setExits(prev => [newExit, ...prev]);
    toast.success('Exit process initiated');
    setDialogOpen(false);
    setForm({ employeeName: '', department: '', resignationDate: '', lastWorkingDay: '', reason: '' });
  };

  const statusColor: Record<string, string> = {
    initiated: 'border-warning text-warning bg-warning/10',
    in_progress: 'border-info text-info bg-info/10',
    completed: 'border-success text-success bg-success/10',
  };

  const selectedRecord = exits.find(e => e.id === selectedExit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exit Management</h1>
          <p className="text-muted-foreground mt-1">Offboarding, exit interviews & final settlements</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Initiate Exit</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Initiate Employee Exit</DialogTitle>
                <DialogDescription>Start the offboarding process for an employee</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Employee Name</Label>
                  <Input placeholder="Full name" value={form.employeeName} onChange={(e) => setForm(f => ({ ...f, employeeName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input placeholder="Department" value={form.department} onChange={(e) => setForm(f => ({ ...f, department: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Resignation Date</Label>
                    <Input type="date" value={form.resignationDate} onChange={(e) => setForm(f => ({ ...f, resignationDate: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Working Day</Label>
                    <Input type="date" value={form.lastWorkingDay} onChange={(e) => setForm(f => ({ ...f, lastWorkingDay: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Reason for Leaving</Label>
                  <Textarea placeholder="Reason..." rows={2} value={form.reason} onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate}>Initiate Exit</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <UserMinus className="w-8 h-8 text-warning" />
            <div>
              <p className="text-sm text-muted-foreground">Active Exits</p>
              <p className="text-3xl font-bold text-warning">{exits.filter(e => e.status !== 'completed').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <ClipboardCheck className="w-8 h-8 text-success" />
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-3xl font-bold text-success">{exits.filter(e => e.status === 'completed').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
            <div>
              <p className="text-sm text-muted-foreground">Pending Settlements</p>
              <p className="text-3xl font-bold text-destructive">{exits.filter(e => !e.settlementDone).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Exit List */}
        <Card className="lg:col-span-1 overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-base">Exit Records</CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/50">
            {exits.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 px-4">
                <UserMinus className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No exit records</p>
              </div>
            ) : (
              exits.map(exit => (
                <div
                  key={exit.id}
                  className={`p-4 cursor-pointer hover:bg-muted/30 transition-colors ${selectedExit === exit.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                  onClick={() => setSelectedExit(exit.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm">{exit.employeeName}</h4>
                    <Badge variant="outline" className={`text-[10px] uppercase ${statusColor[exit.status]}`}>{exit.status.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{exit.department} • LWD: {exit.lastWorkingDay}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Detail Panel */}
        <Card className="lg:col-span-2 overflow-hidden">
          {!selectedRecord ? (
            <CardContent className="flex flex-col items-center gap-2 py-16">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Select an exit record to view details</p>
            </CardContent>
          ) : (
            <>
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-base">{selectedRecord.employeeName}</CardTitle>
                <CardDescription>{selectedRecord.department} • Resigned: {selectedRecord.resignationDate}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="overview">
                  <TabsList className="w-full justify-start rounded-none border-b border-border/50 bg-transparent px-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="assets">Asset Return</TabsTrigger>
                    <TabsTrigger value="interview">Exit Interview</TabsTrigger>
                    <TabsTrigger value="settlement">Settlement</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview" className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded border border-border/50 bg-background/50">
                        <p className="text-xs text-muted-foreground uppercase">Resignation Date</p>
                        <p className="font-medium text-sm mt-1">{selectedRecord.resignationDate}</p>
                      </div>
                      <div className="p-3 rounded border border-border/50 bg-background/50">
                        <p className="text-xs text-muted-foreground uppercase">Last Working Day</p>
                        <p className="font-medium text-sm mt-1">{selectedRecord.lastWorkingDay}</p>
                      </div>
                    </div>
                    <div className="p-3 rounded border border-border/50 bg-background/50">
                      <p className="text-xs text-muted-foreground uppercase">Reason for Leaving</p>
                      <p className="text-sm mt-1">{selectedRecord.reason || 'Not specified'}</p>
                    </div>
                    <div className="flex gap-3">
                      <Badge variant="outline" className={selectedRecord.exitInterview ? 'border-success text-success bg-success/10' : 'border-muted text-muted-foreground'}>
                        <MessageSquare className="w-3 h-3 mr-1" /> Exit Interview {selectedRecord.exitInterview ? '✓' : '—'}
                      </Badge>
                      <Badge variant="outline" className={selectedRecord.assetsReturned ? 'border-success text-success bg-success/10' : 'border-muted text-muted-foreground'}>
                        <Package className="w-3 h-3 mr-1" /> Assets {selectedRecord.assetsReturned ? '✓' : '—'}
                      </Badge>
                      <Badge variant="outline" className={selectedRecord.settlementDone ? 'border-success text-success bg-success/10' : 'border-muted text-muted-foreground'}>
                        <DollarSign className="w-3 h-3 mr-1" /> Settlement {selectedRecord.settlementDone ? '✓' : '—'}
                      </Badge>
                    </div>
                  </TabsContent>
                  <TabsContent value="assets" className="p-6">
                    <h4 className="text-sm font-medium mb-4">Asset Return Checklist</h4>
                    <div className="space-y-3">
                      {assetChecklist.map((item, idx) => {
                        const checks = getAssetChecks(selectedRecord.id);
                        return (
                          <div key={item} className="flex items-center gap-3 p-2 rounded hover:bg-muted/20 cursor-pointer" onClick={() => toggleAsset(selectedRecord.id, idx)}>
                            <Checkbox checked={checks[idx]} />
                            <span className={`text-sm ${checks[idx] ? 'line-through text-muted-foreground' : ''}`}>{item}</span>
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>
                  <TabsContent value="interview" className="p-6 space-y-4">
                    <h4 className="text-sm font-medium">Exit Interview Form</h4>
                    <div className="space-y-3">
                      {['What did you enjoy most about working here?', 'What could we improve as an organization?', 'Would you recommend this company to others?', 'Any suggestions for your successor?'].map((q, i) => (
                        <div key={i} className="space-y-2">
                          <Label className="text-xs text-muted-foreground">{q}</Label>
                          <Textarea placeholder="Your response..." rows={2} className="text-sm" />
                        </div>
                      ))}
                      <Button size="sm">Submit Interview</Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="settlement" className="p-6 space-y-4">
                    <h4 className="text-sm font-medium">Final Settlement Summary</h4>
                    <div className="space-y-3">
                      {[
                        { label: 'Remaining Salary', amount: '₹45,000' },
                        { label: 'Leave Encashment', amount: '₹12,500' },
                        { label: 'Gratuity', amount: '₹0' },
                        { label: 'Bonus (Pro-rata)', amount: '₹8,333' },
                        { label: 'Deductions', amount: '-₹2,000' },
                      ].map(item => (
                        <div key={item.label} className="flex items-center justify-between p-3 bg-background/50 rounded border border-border/50">
                          <span className="text-sm text-muted-foreground">{item.label}</span>
                          <span className="font-medium text-sm">{item.amount}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between p-3 bg-primary/5 rounded border border-primary/30">
                        <span className="font-semibold text-sm">Total Settlement</span>
                        <span className="font-bold text-lg text-primary">₹63,833</span>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
