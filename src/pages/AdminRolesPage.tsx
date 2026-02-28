import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useIsSuperAdmin, useAllUserRoles, useDepartments, useAssignRole, useCreateDepartment, useDeleteDepartment, type AppRole } from "@/hooks/use-roles";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Shield, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  department_head: "Department Head",
  department_staff: "Department Staff",
  general_staff: "General Staff",
};

const ROLE_COLORS: Record<AppRole, string> = {
  super_admin: "bg-destructive/10 text-destructive border-destructive/20",
  department_head: "bg-warning/10 text-warning border-warning/20",
  department_staff: "bg-info/10 text-info border-info/20",
  general_staff: "bg-muted text-muted-foreground border-border",
};

export default function AdminRolesPage() {
  const { isSuperAdmin, isLoading: roleLoading } = useIsSuperAdmin();
  const { data: users = [], isLoading: usersLoading } = useAllUserRoles();
  const { data: departments = [], isLoading: deptsLoading } = useDepartments();
  const assignRole = useAssignRole();
  const createDept = useCreateDepartment();
  const deleteDept = useDeleteDepartment();

  const [newDeptName, setNewDeptName] = useState("");

  if (roleLoading) {
    return <div className="p-6"><Skeleton className="h-64 w-full" /></div>;
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-sm text-muted-foreground">You need Super Admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const handleAssign = (userId: string, role: AppRole, departmentId?: string | null) => {
    assignRole.mutate({ userId, role, departmentId }, {
      onSuccess: () => toast.success("Role updated"),
      onError: (e) => toast.error(e.message),
    });
  };

  const handleCreateDept = () => {
    if (!newDeptName.trim()) return;
    createDept.mutate({ name: newDeptName.trim() }, {
      onSuccess: () => { setNewDeptName(""); toast.success("Department created"); },
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <div>
      <PageHeader title="Roles & Permissions" description="Manage user roles and departments" />
      <div className="p-6">
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users" className="gap-1.5"><Shield className="h-3.5 w-3.5" /> Users & Roles</TabsTrigger>
            <TabsTrigger value="departments" className="gap-1.5"><Building2 className="h-3.5 w-3.5" /> Departments</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            {usersLoading ? <Skeleton className="h-64 w-full" /> : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs font-semibold">Name</TableHead>
                      <TableHead className="text-xs font-semibold">Email</TableHead>
                      <TableHead className="text-xs font-semibold">Role</TableHead>
                      <TableHead className="text-xs font-semibold">Department</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="text-sm font-medium">{u.display_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                        <TableCell>
                          <Select
                            value={u.role || ""}
                            onValueChange={(v) => handleAssign(u.user_id, v as AppRole, u.department_id)}
                          >
                            <SelectTrigger className="w-44 h-8 text-xs">
                              <SelectValue placeholder="Assign role…">
                                {u.role ? (
                                  <Badge variant="outline" className={`text-[11px] ${ROLE_COLORS[u.role]}`}>
                                    {ROLE_LABELS[u.role]}
                                  </Badge>
                                ) : "Assign role…"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => (
                                <SelectItem key={r} value={r} className="text-xs">{ROLE_LABELS[r]}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={u.department_id || "none"}
                            onValueChange={(v) => {
                              if (u.role) handleAssign(u.user_id, u.role, v === "none" ? null : v);
                            }}
                          >
                            <SelectTrigger className="w-40 h-8 text-xs">
                              <SelectValue placeholder="No department" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none" className="text-xs">No department</SelectItem>
                              {departments.map((d) => (
                                <SelectItem key={d.id} value={d.id} className="text-xs">{d.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="departments" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Departments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="New department name…"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    className="h-8 text-sm max-w-xs"
                    onKeyDown={(e) => e.key === "Enter" && handleCreateDept()}
                  />
                  <Button size="sm" className="h-8 text-xs" onClick={handleCreateDept} disabled={createDept.isPending}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>
                {deptsLoading ? <Skeleton className="h-32 w-full" /> : (
                  <div className="space-y-1">
                    {departments.map((d) => (
                      <div key={d.id} className="flex items-center justify-between px-3 py-2 rounded-md border border-border bg-card">
                        <div>
                          <p className="text-sm font-medium">{d.name}</p>
                          {d.description && <p className="text-xs text-muted-foreground">{d.description}</p>}
                        </div>
                        <Button
                          variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive"
                          onClick={() => deleteDept.mutate(d.id, {
                            onSuccess: () => toast.success("Deleted"),
                            onError: (e) => toast.error(e.message),
                          })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    {departments.length === 0 && (
                      <p className="text-sm text-muted-foreground py-4 text-center">No departments yet</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
