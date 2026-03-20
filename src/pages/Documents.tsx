import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, Download, Trash2, Search, Plus, FolderOpen, Shield, FileCheck, File } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

interface Document {
  id: string;
  name: string;
  category: string;
  description: string;
  uploadedBy: string;
  uploadedAt: string;
  size: string;
  expiresAt?: string;
}

const categories = [
  { value: 'hr_policies', label: 'HR Policies', icon: Shield, color: 'text-primary' },
  { value: 'contracts', label: 'Contracts & NDAs', icon: FileCheck, color: 'text-info' },
  { value: 'employee_docs', label: 'Employee Documents', icon: File, color: 'text-warning' },
  { value: 'templates', label: 'Templates', icon: FileText, color: 'text-success' },
];

export default function Documents() {
  const { profile } = useAuthStore();
  const isAdmin = profile?.platform_role === 'company_admin' || profile?.platform_role === 'super_admin' || profile?.platform_role === 'hr_manager';

  const [documents, setDocuments] = useState<Document[]>([
    { id: '1', name: 'Employee Handbook 2026', category: 'hr_policies', description: 'Complete employee handbook with all company policies', uploadedBy: 'HR Admin', uploadedAt: '2026-01-15', size: '2.4 MB' },
    { id: '2', name: 'Non-Disclosure Agreement', category: 'contracts', description: 'Standard NDA template for new hires', uploadedBy: 'Legal Team', uploadedAt: '2026-02-10', size: '540 KB', expiresAt: '2027-02-10' },
    { id: '3', name: 'Remote Work Policy', category: 'hr_policies', description: 'Guidelines for remote and hybrid work arrangements', uploadedBy: 'HR Admin', uploadedAt: '2026-03-01', size: '1.1 MB' },
    { id: '4', name: 'Leave Policy Document', category: 'hr_policies', description: 'Comprehensive leave policy including types and accrual', uploadedBy: 'HR Admin', uploadedAt: '2026-01-20', size: '890 KB' },
    { id: '5', name: 'Offer Letter Template', category: 'templates', description: 'Standard offer letter template with variables', uploadedBy: 'HR Admin', uploadedAt: '2026-02-05', size: '320 KB' },
    { id: '6', name: 'Code of Conduct', category: 'hr_policies', description: 'Company code of conduct and ethics guidelines', uploadedBy: 'HR Admin', uploadedAt: '2026-01-10', size: '1.5 MB' },
    { id: '7', name: 'IT Security Agreement', category: 'contracts', description: 'Data security and usage agreement for all employees', uploadedBy: 'IT Admin', uploadedAt: '2025-06-01', size: '1.0 MB', expiresAt: '2026-03-15' },
    { id: '8', name: 'Tax Declaration Form', category: 'employee_docs', description: 'Annual tax declaration form template', uploadedBy: 'Finance', uploadedAt: '2026-01-05', size: '410 KB', expiresAt: '2026-04-15' },
  ]);

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'hr_policies', description: '', expiresAt: '' });

  const filteredDocs = documents.filter(doc => {
    const matchSearch = doc.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeTab === 'all' || doc.category === activeTab;
    return matchSearch && matchCategory;
  });

  const getExpiryStatus = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const now = new Date();
    const exp = new Date(expiresAt);
    const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { label: 'Expired', class: 'border-destructive text-destructive bg-destructive/10' };
    if (daysLeft <= 30) return { label: `Expires in ${daysLeft}d`, class: 'border-warning text-warning bg-warning/10' };
    return { label: `Expires: ${expiresAt}`, class: 'border-muted text-muted-foreground' };
  };

  const expiringCount = documents.filter(d => { const s = getExpiryStatus(d.expiresAt); return s && (s.label.includes('Expired') || s.label.includes('Expires in')); }).length;

  const handleCreate = () => {
    if (!form.name.trim()) { toast.error('Document name is required'); return; }
    const newDoc: Document = {
      id: Date.now().toString(),
      name: form.name,
      category: form.category,
      description: form.description,
      uploadedBy: profile?.full_name || 'User',
      uploadedAt: new Date().toISOString().split('T')[0],
      size: 'Pending upload',
      expiresAt: form.expiresAt || undefined,
    };
    setDocuments(prev => [newDoc, ...prev]);
    toast.success('Document added');
    setDialogOpen(false);
    setForm({ name: '', category: 'hr_policies', description: '', expiresAt: '' });
  };

  const handleDelete = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    toast.success('Document removed');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Management</h1>
          <p className="text-muted-foreground mt-1">
            HR policies, contracts & company documents
            {expiringCount > 0 && <Badge variant="outline" className="ml-2 border-warning text-warning text-[10px]">{expiringCount} expiring/expired</Badge>}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Upload className="h-4 w-4" /> Upload Document</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>Add a new document to the company repository</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Document Name</Label>
                  <Input placeholder="e.g., Employee Handbook 2026" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Brief description..." rows={2} value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date (optional)</Label>
                  <Input type="date" value={form.expiresAt} onChange={(e) => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
                </div>
                <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">PDF, DOCX, XLSX up to 10MB</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate}>Upload Document</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Category Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map(cat => {
          const count = documents.filter(d => d.category === cat.value).length;
          return (
            <Card key={cat.value} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveTab(cat.value)}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-3 rounded-lg bg-background border border-border/50 ${cat.color}`}>
                  <cat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">{cat.label}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter & Search */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search documents..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map(c => (
            <TabsTrigger key={c.value} value={c.value}>{c.label}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={activeTab} className="mt-4">
          {filteredDocs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12">
                <FolderOpen className="h-12 w-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No documents found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredDocs.map(doc => (
                <Card key={doc.id} className="hover:border-primary/40 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded bg-primary/10">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{doc.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{doc.description}</p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground uppercase">
                          <span>{doc.uploadedBy}</span>
                          <span>&bull;</span>
                          <span>{doc.uploadedAt}</span>
                          <span>&bull;</span>
                          <span>{doc.size}</span>
                          {doc.expiresAt && (() => {
                            const status = getExpiryStatus(doc.expiresAt);
                            return status ? (
                              <>
                                <span>&bull;</span>
                                <Badge variant="outline" className={`text-[10px] ${status.class}`}>{status.label}</Badge>
                              </>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10">
                        <Download className="w-4 h-4" />
                      </Button>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(doc.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
