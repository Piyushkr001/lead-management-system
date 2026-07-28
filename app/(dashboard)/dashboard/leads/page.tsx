"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Search } from "lucide-react";
import { useUser } from "@/components/dashboard/UserProvider";
import { LeadStatus } from "@/lib/types";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";

// Typings for leads and pagination
interface Lead {
  id: number;
  name: string;
  email: string;
  company?: string;
  status: LeadStatus;
  assignedTo?: number;
  assignedUser: { id: number; name: string; email: string } | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function LeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useUser();

  // Filters from URL
  const page = parseInt(searchParams?.get("page") || "1", 10);
  const status = searchParams?.get("status") || "ALL";
  const search = searchParams?.get("search") || "";

  // Search input state for debouncing
  const [searchInput, setSearchInput] = useState(search);

  // Fetch current user and leads
  useEffect(() => {
    const fetchUserAndLeads = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!currentUser) return;

        // Build query string
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("pageSize", "10");
        if (status !== "ALL") params.set("status", status);
        if (search) params.set("search", search);

        const res = await axios.get(`/api/leads?${params.toString()}`);
        setLeads(res.data.data);
        setPagination(res.data.pagination);
      } catch (err: unknown) {
        const _error = err as { response?: { data?: { error?: { message?: string } } } };
        setError(_error.response?.data?.error?.message || "Failed to load leads");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndLeads();
  }, [page, status, search, currentUser]);

  // Debounced search sync to URL
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== search) {
        const params = new URLSearchParams(searchParams?.toString() || "");
        if (searchInput) {
          params.set("search", searchInput);
        } else {
          params.delete("search");
        }
        params.set("page", "1"); // reset to page 1 on search change
        router.replace(`/dashboard/leads?${params.toString()}`);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchInput, search, searchParams, router]);

  const handleStatusChange = (val: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (val && val !== "ALL") {
      params.set("status", val);
    } else {
      params.delete("status");
    }
    params.set("page", "1");
    router.replace(`/dashboard/leads?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("page", newPage.toString());
    router.push(`/dashboard/leads?${params.toString()}`);
  };

  const getStatusBadgeVariant = (status: LeadStatus): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "NEW": return "default";
      case "CONTACTED": return "secondary";
      case "QUALIFIED": return "outline"; // Ideally warning/success colors
      case "PROPOSAL": return "outline";
      case "WON": return "secondary"; // Assuming green styling for success in custom CSS
      case "LOST": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="flex flex-col space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {currentUser?.role === "ADMIN" ? "Leads" : "My Leads"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and track your incoming opportunities.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            className="pl-8"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-45">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="NEW">New</SelectItem>
            <SelectItem value="CONTACTED">Contacted</SelectItem>
            <SelectItem value="QUALIFIED">Qualified</SelectItem>
            <SelectItem value="PROPOSAL">Proposal</SelectItem>
            <SelectItem value="WON">Won</SelectItem>
            <SelectItem value="LOST">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          {error}
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden md:table-cell">Company/Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Assigned To</TableHead>
              <TableHead className="hidden lg:table-cell">Created</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading Skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-37.5" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-50" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-25" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : leads.length === 0 ? (
              // Empty State
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-muted-foreground font-medium">
                      {currentUser?.role === "ADMIN" 
                        ? "New website enquiries will appear here." 
                        : "No leads have been assigned to you yet."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              // Data Rows
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {lead.company || lead.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(lead.status)}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">
                    {lead.assignedUser ? (
                      <span className="text-muted-foreground">{lead.assignedUser.name}</span>
                    ) : (
                      <span className="text-muted-foreground italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {format(new Date(lead.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/leads/${lead.id}`)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing <span className="font-medium">{((pagination.page - 1) * pagination.pageSize) + 1}</span> to <span className="font-medium">{Math.min(pagination.page * pagination.pageSize, pagination.total)}</span> of{" "}
            <span className="font-medium">{pagination.total}</span> leads
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            <div className="flex items-center px-4 font-medium">
              {pagination.page} / {pagination.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
