import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Network, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface OrgNode {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  designation: string;
  department: string;
  status: string;
  children: OrgNode[];
}

function buildOrgTree(employees: any[]): OrgNode[] {
  const map = new Map<string, OrgNode>();
  const roots: OrgNode[] = [];

  // Create nodes
  employees.forEach(emp => {
    map.set(emp.id, {
      id: emp.id,
      first_name: emp.first_name,
      last_name: emp.last_name,
      avatar_url: emp.avatar_url,
      designation: emp.designations?.title || 'Team Member',
      department: emp.departments?.name || '',
      status: emp.status || 'active',
      children: [],
    });
  });

  // Build tree
  employees.forEach(emp => {
    const node = map.get(emp.id);
    if (!node) return;
    if (emp.reporting_manager_id && map.has(emp.reporting_manager_id)) {
      map.get(emp.reporting_manager_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function OrgNodeCard({ node, level = 0 }: { node: OrgNode; level?: number }) {
  const [expanded, setExpanded] = useState(level < 2);
  const hasChildren = node.children.length > 0;

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative group cursor-pointer transition-all hover:scale-105 ${level === 0 ? 'mb-8' : 'mb-4'}`}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        <Card className={`w-56 overflow-hidden border-border/50 hover:border-primary/50 transition-colors ${level === 0 ? 'border-primary/40 bg-primary/5' : 'bg-card/60'}`}>
          <CardContent className="p-4 text-center">
            <Avatar className={`mx-auto mb-3 ${level === 0 ? 'h-14 w-14' : 'h-10 w-10'}`}>
              <AvatarImage src={node.avatar_url || ''} />
              <AvatarFallback className="bg-primary/20 text-primary font-medium">
                {node.first_name[0]}{node.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <h4 className={`font-semibold truncate ${level === 0 ? 'text-primary text-base' : 'text-sm'}`}>
              {node.first_name} {node.last_name}
            </h4>
            <p className="text-xs text-muted-foreground mt-1 truncate">{node.designation}</p>
            {node.department && (
              <Badge variant="outline" className="mt-2 text-[10px] border-border/50">
                {node.department}
              </Badge>
            )}
            {hasChildren && (
              <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <span>{node.children.length} report{node.children.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {hasChildren && expanded && (
        <>
          {/* Connector line */}
          <div className="w-px h-6 bg-border/50" />
          <div className="flex gap-6 relative">
            {/* Horizontal connector */}
            {node.children.length > 1 && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-border/50" style={{ width: `calc(100% - 14rem)` }} />
            )}
            {node.children.map(child => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="w-px h-6 bg-border/50" />
                <OrgNodeCard node={child} level={level + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function EmployeeOrgChart({ employees }: { employees: any[] }) {
  const orgTree = buildOrgTree(employees);

  if (orgTree.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12">
        <Network className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No organizational data available</p>
        <p className="text-xs text-muted-foreground/60">Set reporting relationships in employee profiles to build the org chart</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center min-w-max p-8">
      <div className="flex flex-col items-center gap-2">
        {orgTree.map(root => (
          <OrgNodeCard key={root.id} node={root} />
        ))}
      </div>
    </div>
  );
}
