import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Activity } from "lucide-react";
import { db } from "@/db";
import { leadsTable } from "@/db/schema/leads";
import { usersTable } from "@/db/schema/users";
import { eq, and, sql, inArray } from "drizzle-orm";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) return null; // Caught by layout redirect

  const leadCondition = user.role === "MEMBER" ? eq(leadsTable.assignedTo, user.id) : undefined;
  
  // Fetch Total Leads
  const [totalLeadsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leadsTable)
    .where(leadCondition);
    
  const totalLeads = Number(totalLeadsResult.count);

  // Fetch Active Deals
  type Status = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST";
  const activeStatuses: Status[] = ["CONTACTED", "QUALIFIED", "PROPOSAL"];
  const activeDealsCondition = user.role === "MEMBER" 
    ? and(eq(leadsTable.assignedTo, user.id), inArray(leadsTable.status, activeStatuses))
    : inArray(leadsTable.status, activeStatuses);
    
  const [activeDealsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(leadsTable)
    .where(activeDealsCondition);
    
  const activeDeals = Number(activeDealsResult.count);
  
  // Fetch Team Members
  let totalTeamMembers = 0;
  if (user.role === "ADMIN") {
    const [teamMembersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(usersTable)
      .where(and(eq(usersTable.isActive, true), eq(usersTable.role, "MEMBER")));
    totalTeamMembers = Number(teamMembersResult.count);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user.name}. You are logged in as {user.role}.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently assigned or available
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDeals}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Leads in Contacted, Qualified, or Proposal
            </p>
          </CardContent>
        </Card>
        
        {user.role === "ADMIN" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTeamMembers}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active members on the platform
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
