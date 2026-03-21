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
import { UserMinus, ClipboardCheck, DollarSign, MessageSquare, Package, Plus, AlertTriangle, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/auth-store';
import { useState } from 'react';
import { toast } from 'sonner';

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
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ employee_id: '', resignation_date: '', last_working_day: '', reason: '' });
  const [selectedExit, setSelectedExit] = useState<string | null>(null);
  const [interviewAnswers, setInterviewAnswers] = useState<string[]>(['', '', '', '']);

  // Fetch Exits
  const { data: exits = [], isLoading: isLoadingExits } = useQuery({
    queryKey: ['exits', profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employee_exits')
        .select(`
          *,
          employees (id, first_name, last_name, employee_code, departments(name))
        `)
        .eq('company_id', profile!.company_id!)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.company_id,
  });

  // Fetch Active Employees for new exit dropdown
  const { data: activeEmployees = [] } = useQuery({
    queryKey: ['activeEmployees', profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, first_name, last_name, employee_code, departments(name)')
        .eq('company_id', profile!.company_id!)
        .neq('status', 'terminated')
        .neq('status', 'resigned')
        .is('deleted_at', null)
        .order('first_name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.company_id && dialogOpen,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.employee_id) throw new Error('Please select an employee');
      if (!form.resignation_date) throw new Error('Resignation date is required');
      if (!form.last_working_day) throw new Error('Last working day is required');

      const { data, error } = await supabase
        .from('employee_exits')
        .insert({
          company_id: profile!.company_id!,
          employee_id: form.employee_id,
          resignation_date: form.resignation_date,
          last_working_day: form.last_working_day,
          reason: form.reason || null,
          status: 'initiated',
        })
        .select()
        .single();

      if (error) throw error;

      // Update employee status to resigned
      await supabase
        .from('employees')
        .update({ status: 'resigned' })
        .eq('id', form.employee_id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exits'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['activeEmployees'] });
      toast.success('Exit process initiated successfully');
      setDialogOpen(false);
      setForm({ employee_id: '', resignation_date: '', last_working_day: '', reason: '' });
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to initiate exit');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: any }) => {
      const { data, error } = await supabase
        .from('employee_exits')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exits'] });
      toast.success('Exit record updated');
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to update record')
  });

  const handleCreate = () => {
    createMutation.mutate();
  };

  const getAssetChecks = (exitRecord: any) => {
    if (exitRecord.assets_checklist && Array.isArray(exitRecord.assets_checklist) && exitRecord.assets_checklist.length > 0) {
      return exitRecord.assets_checklist;
    }
    return assetChecklist.map(() => false);
  };

  const toggleAsset = (exitId: string, idx: number, currentList: boolean[]) => {
    const updated = [...currentList];
    updated[idx] = !updated[idx];
    const allReturned = updated.every(Boolean);
    updateMutation.mutate({ 
      id: exitId, 
      updates: { 
        assets_checklist: updated,
        assets_returned: allReturned
      } 
    });
  };

  const submitInterview = (exitId: string) => {
    updateMutation.mutate({
      id: exitId,
      updates: {
        exit_interview: true,
        exit_interview_answers: interviewAnswers
      }
    });
  };

  const markSettlementDone = (exitId: string) => {
    updateMutation.mutate({
      id: exitId,
      updates: {
        settlement_done: true,
        status: 'completed'
      }
    });
  };

  const statusColor: Record<string, string> = {
    initiated: 'border-warning text-warning bg-warning/10',
    in_progress: 'border-info text-info bg-info/10',
    completed: 'border-success text-success bg-success/10',
  };

  const selectedRecord = exits.find(e => e.id === selectedExit);

  // Set initial interview answers when selection changes
  const handleTabChange = (val: string) => {
    if (val === 'interview' && selectedRecord) {
      const existingAnswers = selectedRecord.exit_interview_answers;
      if (existingAnswers && Array.isArray(existingAnswers) && existingAnswers.length > 0) {
        setInterviewAnswers(existingAnswers);
      } else {
        setInterviewAnswers(['', '', '', '']);
      }
    }
  };

  const getEmployeeName = (emp: any) => emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown';
  const getDepartmentName = (emp: any) => emp?.departments?.name || 'Unknown Department';

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
                <DialogDescription>Start the offboarding process for an active employee</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Employee</Label>
                  <Select value={form.employee_id} onValueChange={(val) => setForm(f => ({ ...f, employee_id: val }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an active employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeEmployees.map((emp: any) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.first_name} {emp.last_name} ({emp.employee_code || 'N/A'}) - {emp.departments?.name || 'No Dept'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Resignation Date</Label>
                    <Input type="date" value={form.resignation_date} onChange={(e) => setForm(f => ({ ...f, resignation_date: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Working Day</Label>
                    <Input type="date" value={form.last_working_day} onChange={(e) => setForm(f => ({ ...f, last_working_day: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Reason for Leaving</Label>
                  <Textarea placeholder="Reason..." rows={2} value={form.reason} onChange={(e) => setForm(f => ({ ...f, reason: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={createMutation.isPending}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Initiate Exit
                </Button>
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
              <p className="text-3xl font-bold text-destructive">{exits.filter(e => !e.settlement_done).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Exit List */}
        <Card className="lg:col-span-1 overflow-hidden h-fit">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-base">Exit Records</CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-border/50 max-h-[600px] overflow-y-auto">
            {isLoadingExits ? (
              <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : exits.length === 0 ? (
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
                    <h4 className="font-medium text-sm">{getEmployeeName(exit.employees)}</h4>
                    <Badge variant="outline" className={`text-[10px] uppercase ${statusColor[exit.status]}`}>{exit.status.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{getDepartmentName(exit.employees)} • LWD: {exit.last_working_day || 'N/A'}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Detail Panel */}
        <Card className="lg:col-span-2 overflow-hidden h-fit">
          {!selectedRecord ? (
            <CardContent className="flex flex-col items-center gap-2 py-16">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Select an exit record to view details</p>
            </CardContent>
          ) : (
            <>
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{getEmployeeName(selectedRecord.employees)}</span>
                  {selectedRecord.status !== 'completed' && selectedRecord.assets_returned && selectedRecord.exit_interview && (
                     <Button size="sm" variant="outline" className="h-7 text-xs border-success/50 text-success hover:bg-success hover:text-success-foreground" onClick={() => updateMutation.mutate({id: selectedRecord.id, updates: {status: 'in_progress'}})}>Mark In Progress</Button>
                  )}
                </CardTitle>
                <CardDescription>{getDepartmentName(selectedRecord.employees)} • Resigned: {selectedRecord.resignation_date || 'N/A'}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="overview" onValueChange={handleTabChange}>
                  <TabsList className="w-full justify-start rounded-none border-b border-border/50 bg-transparent px-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="assets">Asset Return</TabsTrigger>
                    <TabsTrigger value="interview">Exit Interview</TabsTrigger>
                    <TabsTrigger value="settlement">Settlement</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="p-6 space-y-4 mt-0">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded border border-border/50 bg-background/50">
                        <p className="text-xs text-muted-foreground uppercase">Resignation Date</p>
                        <p className="font-medium text-sm mt-1">{selectedRecord.resignation_date || '—'}</p>
                      </div>
                      <div className="p-3 rounded border border-border/50 bg-background/50">
                        <p className="text-xs text-muted-foreground uppercase">Last Working Day</p>
                        <p className="font-medium text-sm mt-1">{selectedRecord.last_working_day || '—'}</p>
                      </div>
                    </div>
                    <div className="p-3 rounded border border-border/50 bg-background/50">
                      <p className="text-xs text-muted-foreground uppercase">Reason for Leaving</p>
                      <p className="text-sm mt-1">{selectedRecord.reason || 'Not specified'}</p>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-4">
                      <Badge variant="outline" className={selectedRecord.exit_interview ? 'border-success text-success bg-success/10' : 'border-muted text-muted-foreground'}>
                        <MessageSquare className="w-3 h-3 mr-1" /> Exit Interview {selectedRecord.exit_interview ? '✓' : '—'}
                      </Badge>
                      <Badge variant="outline" className={selectedRecord.assets_returned ? 'border-success text-success bg-success/10' : 'border-muted text-muted-foreground'}>
                        <Package className="w-3 h-3 mr-1" /> Assets {selectedRecord.assets_returned ? '✓' : '—'}
                      </Badge>
                      <Badge variant="outline" className={selectedRecord.settlement_done ? 'border-success text-success bg-success/10' : 'border-muted text-muted-foreground'}>
                        <DollarSign className="w-3 h-3 mr-1" /> Settlement {selectedRecord.settlement_done ? '✓' : '—'}
                      </Badge>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="assets" className="p-6 mt-0">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium">Asset Return Checklist</h4>
                      {selectedRecord.assets_returned && <Badge variant="outline" className="border-success text-success bg-success/10">All Returned</Badge>}
                    </div>
                    <div className="space-y-3">
                      {assetChecklist.map((item, idx) => {
                        const checks = getAssetChecks(selectedRecord);
                        return (
                          <div key={item} className="flex items-center gap-3 p-2 rounded border border-border/30 hover:bg-muted/20 cursor-pointer" onClick={() => toggleAsset(selectedRecord.id, idx, checks)}>
                            {updateMutation.isPending && updateMutation.variables?.updates?.assets_checklist !== undefined ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : (
                              <Checkbox checked={checks[idx] || false} />
                            )}
                            <span className={`text-sm select-none ${checks[idx] ? 'line-through text-muted-foreground' : ''}`}>{item}</span>
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="interview" className="p-6 space-y-4 mt-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Exit Interview Form</h4>
                      {selectedRecord.exit_interview && <Badge variant="outline" className="border-success text-success bg-success/10">Completed</Badge>}
                    </div>
                    <div className="space-y-4">
                      {['What did you enjoy most about working here?', 'What could we improve as an organization?', 'Would you recommend this company to others?', 'Any suggestions for your successor?'].map((q, i) => (
                        <div key={i} className="space-y-2">
                          <Label className="text-xs text-muted-foreground">{q}</Label>
                          <Textarea 
                            placeholder="Your response..." 
                            rows={2} 
                            className="text-sm resize-y" 
                            disabled={selectedRecord.exit_interview}
                            value={interviewAnswers[i] || ''}
                            onChange={(e) => {
                              const newAns = [...interviewAnswers];
                              newAns[i] = e.target.value;
                              setInterviewAnswers(newAns);
                            }}
                          />
                        </div>
                      ))}
                      {!selectedRecord.exit_interview && (
                        <Button size="sm" onClick={() => submitInterview(selectedRecord.id)} disabled={updateMutation.isPending}>
                          {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Submit Interview
                        </Button>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="settlement" className="p-6 space-y-4 mt-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Final Settlement Summary</h4>
                      {selectedRecord.settlement_done && <Badge variant="outline" className="border-success text-success bg-success/10">Settled</Badge>}
                    </div>
                    {/* Placeholder content for settlement, in real app, fetch from payroll module */}
                    <div className="space-y-3">
                      <div className="p-4 border border-border/50 bg-background/40 rounded-md text-center">
                         <p className="text-sm text-muted-foreground mb-4">Settlement usually connects with the Payroll module. Mark as completed once the final checks are cleared.</p>
                         {!selectedRecord.settlement_done ? (
                           <Button onClick={() => markSettlementDone(selectedRecord.id)} disabled={updateMutation.isPending}>
                             {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                             Mark Settlement as Processed
                           </Button>
                         ) : (
                           <Button variant="outline" disabled>Settlement Done</Button>
                         )}
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
