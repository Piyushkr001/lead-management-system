"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import axios from "axios";
import { useUser } from "@/components/dashboard/UserProvider";
import { Role, LeadStatus } from "@/lib/types";
import { ArrowLeft, User, Building, Phone, Mail, Clock, Send, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";

// Typings
interface UserObj {
  id: number;
  name: string;
  email: string;
  role: Role;
}

interface LeadObj {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  source: string;
  status: LeadStatus;
  assignedUser: { id: number; name: string; email: string } | null;
  createdAt: string;
}

interface NoteObj {
  id: number;
  body: string;
  createdAt: string;
  author: { id: number; name: string; email: string } | null;
}

interface ActivityObj {
  id: number;
  type: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: { id: number; name: string } | null;
}

export default function LeadDetailPage({ params }: { params: Promise<{ leadId: string }> }) {
  const router = useRouter();
  const { leadId } = use(params);

  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState<LeadObj | null>(null);
  const [notes, setNotes] = useState<NoteObj[]>([]);
  const [activities, setActivities] = useState<ActivityObj[]>([]);
  const { user: currentUser } = useUser();
  const [members, setMembers] = useState<UserObj[]>([]);
  
  const [noteBody, setNoteBody] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        if (!currentUser) return;

        // Fetch Lead
        const leadRes = await axios.get(`/api/leads/${leadId}`);
        setLead(leadRes.data.data);

        // Fetch Notes & Activities in parallel
        const [notesRes, activitiesRes] = await Promise.all([
          axios.get(`/api/leads/${leadId}/notes`),
          axios.get(`/api/leads/${leadId}/activities`),
        ]);
        setNotes(notesRes.data.data);
        setActivities(activitiesRes.data.data);

        // Fetch Members if Admin
        if (currentUser.role === "ADMIN") {
          const membersRes = await axios.get("/api/users?role=MEMBER");
          setMembers(membersRes.data.data);
        }
      } catch (err: unknown) {
        const error = err as { response?: { status?: number, data?: { error?: { message?: string } } } };
        toast.error(error.response?.data?.error?.message || "Failed to load lead details");
        if (error.response?.status === 404 || error.response?.status === 403) {
          router.push("/dashboard/leads");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [leadId, router, currentUser]);

  const handleStatusChange = async (newStatus: string | null) => {
    if (!newStatus) return;
    try {
      setIsUpdatingStatus(true);
      const res = await axios.patch(`/api/leads/${leadId}`, { status: newStatus });
      setLead(res.data.data);
      toast.success("Status updated");
      // Refresh activities
      const activitiesRes = await axios.get(`/api/leads/${leadId}/activities`);
      setActivities(activitiesRes.data.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || "Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssignmentChange = async (memberId: string | null) => {
    if (!memberId) return;
    try {
      setIsAssigning(true);
      const parsedId = parseInt(memberId, 10);
      const res = await axios.patch(`/api/leads/${leadId}`, { assignedTo: parsedId });
      setLead(res.data.data);
      toast.success("Lead assigned successfully");
      // Refresh activities
      const activitiesRes = await axios.get(`/api/leads/${leadId}/activities`);
      setActivities(activitiesRes.data.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || "Failed to assign lead");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteBody.trim()) return;
    try {
      setIsSubmittingNote(true);
      const res = await axios.post(`/api/leads/${leadId}/notes`, { body: noteBody });
      setNotes([res.data.data, ...notes]);
      setNoteBody("");
      toast.success("Note added");
      // Refresh activities
      const activitiesRes = await axios.get(`/api/leads/${leadId}/activities`);
      setActivities(activitiesRes.data.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || "Failed to add note");
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const getStatusBadgeVariant = (status: LeadStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "NEW": return "default";
      case "CONTACTED": return "secondary";
      case "QUALIFIED": return "outline";
      case "PROPOSAL": return "outline";
      case "WON": return "secondary";
      case "LOST": return "destructive";
      default: return "outline";
    }
  };

  const formatActivityText = (activity: ActivityObj) => {
    const actorName = activity.actor?.name || "System";
    switch (activity.type) {
      case "LEAD_CREATED": return `${actorName} created the lead via ${activity.metadata?.source || 'unknown source'}`;
      case "LEAD_ASSIGNED": return `${actorName} assigned the lead to ${activity.metadata?.newAssigneeName || 'a member'}`;
      case "LEAD_REASSIGNED": return `${actorName} reassigned the lead from ${activity.metadata?.previousAssigneeName || 'a member'} to ${activity.metadata?.newAssigneeName || 'a member'}`;
      case "STATUS_CHANGED": return `${actorName} changed status from ${activity.metadata?.from} to ${activity.metadata?.to}`;
      case "NOTE_ADDED": return `${actorName} added a note`;
      default: return `${actorName} performed ${activity.type}`;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col space-y-6 p-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-md" />
            <Skeleton className="h-64 w-full rounded-md" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 w-full rounded-md" />
            <Skeleton className="h-96 w-full rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (!lead) return null;

  return (
    <div className="flex flex-col space-y-6 p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/dashboard/leads")} className="rounded-full">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            {lead.name}
            <Badge variant={getStatusBadgeVariant(lead.status)} className="text-sm">
              {lead.status}
            </Badge>
          </h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
            <Clock className="h-4 w-4" />
            Created {format(new Date(lead.createdAt), "MMM d, yyyy h:mm a")} via {lead.source}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Info & Notes */}
        <div className="lg:col-span-2 space-y-8">
          {/* Lead Information Card */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{lead.email}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{lead.phone || "—"}</span>
                </div>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Company</p>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{lead.company || "—"}</span>
                </div>
              </div>
            </div>
            
            {lead.message && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">Message from Lead</p>
                <div className="bg-muted/50 p-4 rounded-md text-sm whitespace-pre-wrap">
                  {lead.message}
                </div>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b bg-muted/20">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Notes
              </h2>
            </div>
            
            <div className="p-6 bg-card">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-3">
                  <Textarea 
                    placeholder="Leave a note..." 
                    className="min-h-25 resize-none"
                    value={noteBody}
                    onChange={(e) => setNoteBody(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleAddNote} 
                      disabled={isSubmittingNote || !noteBody.trim()}
                      className="gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Add Note
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="divide-y max-h-125 overflow-y-auto">
              {notes.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground text-sm">
                  No notes yet. Add one above.
                </div>
              ) : (
                notes.map(note => (
                  <div key={note.id} className="p-6 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 text-sm font-medium">
                        {note.author?.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{note.author?.name || "Unknown User"}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(note.createdAt), "MMM d, h:mm a")}</p>
                        </div>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{note.body}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Side Panel: Actions & Timeline */}
        <div className="space-y-8">
          {/* Actions */}
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Manage Lead</h3>
            
            <div className="space-y-3">
              <label className="text-sm font-medium">Status</label>
              <Select value={lead.status} onValueChange={handleStatusChange} disabled={isUpdatingStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="CONTACTED">Contacted</SelectItem>
                  <SelectItem value="QUALIFIED">Qualified</SelectItem>
                  <SelectItem value="PROPOSAL">Proposal</SelectItem>
                  <SelectItem value="WON">Won</SelectItem>
                  <SelectItem value="LOST">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Assigned To</label>
              {currentUser?.role === "ADMIN" ? (
                <Select 
                  value={lead.assignedUser?.id?.toString() || "UNASSIGNED"} 
                  onValueChange={handleAssignmentChange} 
                  disabled={isAssigning}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Assign a member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNASSIGNED" disabled>Select Member</SelectItem>
                    {members.map(member => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-3 border rounded-md bg-muted/50 text-sm">
                  {lead.assignedUser?.name || "Unassigned"}
                </div>
              )}
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Activity Timeline</h3>
            </div>
            <div className="p-5 max-h-125 overflow-y-auto">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
              ) : (
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-muted before:to-transparent">
                  {activities.map((activity) => (
                    <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-4 h-4 rounded-full border-4 border-background bg-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ml-3.5 md:ml-0 z-10"></div>
                      <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border bg-card shadow-sm text-sm ml-4 md:ml-0">
                        <div className="flex flex-col gap-1">
                          <p className="font-medium text-foreground">{formatActivityText(activity)}</p>
                          <time className="text-xs text-muted-foreground font-mono">{format(new Date(activity.createdAt), "MMM d, h:mm a")}</time>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
