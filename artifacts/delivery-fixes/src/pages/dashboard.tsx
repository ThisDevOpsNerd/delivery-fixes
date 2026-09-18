import { useState } from "react";
import { 
  useListDeliveryIssues, 
  useGetDeliverySummary,
  useCreateDeliveryIssue,
  useUpdateDeliveryIssue,
  getListDeliveryIssuesQueryKey,
  getGetDeliverySummaryQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  RefreshCcw,
  Check
} from "lucide-react";
import { format } from "date-fns";

export function Dashboard() {
  const [filter, setFilter] = useState<"all" | "needs_attention" | "in_progress" | "resolved">("needs_attention");
  const queryClient = useQueryClient();

  const { data: summary, isLoading: loadingSummary } = useGetDeliverySummary();
  
  const { data: issues, isLoading: loadingIssues } = useListDeliveryIssues(
    filter === "all" ? {} : { status: filter }
  );

  const createIssue = useCreateDeliveryIssue();
  const updateIssue = useUpdateDeliveryIssue();

  const handleCreateDemo = () => {
    createIssue.mutate({
      data: {
        orderNumber: `ORD-${Math.floor(Math.random() * 10000)}`,
        customerName: "Jane Doe",
        customerEmail: "jane@example.com",
        issueType: "wrong_address",
        currentAddress: "123 Old St, City, Country",
        requestedAddress: "456 New Ave, City, Country",
        orderValue: 149.99,
        itemCount: 2,
        note: "Customer realized they used their old shipping address."
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDeliveryIssuesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDeliverySummaryQueryKey() });
      }
    });
  };

  const handleResolve = (id: number) => {
    updateIssue.mutate({
      id,
      data: { status: "resolved" }
    }, {
      onSuccess: (updated) => {
        queryClient.setQueryData(getListDeliveryIssuesQueryKey(filter === "all" ? undefined : { status: filter }), (old: any) => {
          if (!old) return old;
          return old.map((issue: any) => issue.id === id ? { ...issue, status: updated.status } : issue);
        });
        queryClient.invalidateQueries({ queryKey: getGetDeliverySummaryQueryKey() });
      }
    });
  };

  const handleReopen = (id: number) => {
    updateIssue.mutate({
      id,
      data: { status: "needs_attention" }
    }, {
      onSuccess: (updated) => {
        queryClient.setQueryData(getListDeliveryIssuesQueryKey(filter === "all" ? undefined : { status: filter }), (old: any) => {
          if (!old) return old;
          return old.map((issue: any) => issue.id === id ? { ...issue, status: updated.status } : issue);
        });
        queryClient.invalidateQueries({ queryKey: getGetDeliverySummaryQueryKey() });
      }
    });
  };

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Issue Queue</h1>
          <p className="text-muted-foreground mt-1 text-lg">Monitor and resolve delivery blocks before they become support tickets.</p>
        </div>
        <Button onClick={handleCreateDemo} disabled={createIssue.isPending} variant="secondary" className="shadow-sm font-semibold">
          {createIssue.isPending ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <AlertCircle className="w-4 h-4 mr-2" />}
          Simulate Demo Issue
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          title="Needs Attention" 
          value={summary?.needsAttention ?? "-"} 
          icon={AlertCircle} 
          loading={loadingSummary}
          alert={summary?.needsAttention ? summary.needsAttention > 0 : false}
        />
        <SummaryCard 
          title="Resolved Today" 
          value={summary?.resolvedToday ?? "-"} 
          icon={CheckCircle2} 
          loading={loadingSummary} 
        />
        <SummaryCard 
          title="Protected Value" 
          value={summary ? `$${summary.protectedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"} 
          icon={ShieldCheck} 
          loading={loadingSummary} 
        />
        <SummaryCard 
          title="Avg. Response" 
          value={summary ? `${summary.averageResponseMinutes}m` : "-"} 
          icon={Clock} 
          loading={loadingSummary} 
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 -mb-2 no-scrollbar">
          {(["needs_attention", "in_progress", "resolved", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                filter === f 
                  ? "bg-foreground text-background shadow-sm" 
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {f === "all" ? "All Issues" : f.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>

        {loadingIssues ? (
          <div className="space-y-4 mt-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-6">
                <div className="flex gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-1/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : issues?.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-secondary/30 mt-6 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Queue is clear</h3>
            <p className="text-muted-foreground max-w-sm">
              No delivery issues matching this filter. Your queue is clean and orders are moving.
            </p>
          </Card>
        ) : (
          <div className="space-y-4 mt-6">
            {issues?.map((issue) => (
              <Card key={issue.id} className="group overflow-hidden border transition-shadow hover:shadow-md bg-card">
                <div className="p-5 md:p-6 flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                          <h3 className="font-extrabold text-xl">{issue.orderNumber}</h3>
                          <Badge variant={
                            issue.status === "needs_attention" ? "destructive" :
                            issue.status === "resolved" ? "secondary" : "default"
                          } className="capitalize text-xs px-2.5 py-0.5">
                            {issue.status.replace("_", " ")}
                          </Badge>
                          <Badge variant="outline" className="capitalize text-muted-foreground text-xs px-2.5 py-0.5 border-border bg-secondary/50">
                            {issue.issueType.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 flex-wrap">
                          <span className="text-foreground">{issue.customerName}</span>
                          <span>•</span>
                          <span>{issue.customerEmail}</span>
                          <span>•</span>
                          <span className="font-bold">${issue.orderValue.toFixed(2)}</span>
                        </p>
                      </div>
                      <div className="text-xs font-semibold text-muted-foreground whitespace-nowrap bg-secondary/80 px-2 py-1 rounded-md">
                        {format(new Date(issue.createdAt), "MMM d, h:mm a")}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm bg-secondary/40 p-4 rounded-xl border border-border/50">
                      <div>
                        <div className="text-muted-foreground font-bold mb-1.5 text-[11px] uppercase tracking-wider">Current Address</div>
                        <div className="flex items-start gap-2.5">
                          <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                          <span className={issue.issueType === "address_change" || issue.issueType === "wrong_address" ? "line-through text-muted-foreground font-medium" : "font-medium text-foreground"}>
                            {issue.currentAddress}
                          </span>
                        </div>
                      </div>
                      {(issue.issueType === "address_change" || issue.issueType === "wrong_address") && (
                        <div>
                          <div className="text-primary font-bold mb-1.5 text-[11px] uppercase tracking-wider">Requested Address</div>
                          <div className="flex items-start gap-2.5">
                            <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <span className="font-bold text-foreground">{issue.requestedAddress}</span>
                          </div>
                        </div>
                      )}
                      {issue.note && (
                        <div className="lg:col-span-2 mt-2">
                          <div className="text-muted-foreground font-bold mb-1.5 text-[11px] uppercase tracking-wider">Customer Note</div>
                          <p className="text-foreground/90 font-medium bg-background p-3 rounded-lg border border-border/50 shadow-sm text-sm">
                            "{issue.note}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex md:flex-col justify-end gap-3 md:border-l md:pl-6 border-border pt-4 md:pt-0 border-t md:border-t-0 md:min-w-[160px]">
                    {issue.status === "resolved" ? (
                      <Button 
                        variant="outline" 
                        className="w-full font-bold shadow-sm"
                        onClick={() => handleReopen(issue.id)}
                        disabled={updateIssue.isPending}
                      >
                        Reopen Issue
                      </Button>
                    ) : (
                      <Button 
                        className="w-full font-bold shadow-sm"
                        onClick={() => handleResolve(issue.id)}
                        disabled={updateIssue.isPending}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Mark Resolved
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, loading, alert }: { title: string, value: string | number, icon: any, loading: boolean, alert?: boolean }) {
  return (
    <Card className={`p-5 md:p-6 shadow-sm transition-all ${alert ? 'border-primary/50 ring-1 ring-primary/20 bg-primary/[0.03]' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <h2 className={`text-3xl font-extrabold tracking-tight ${alert ? 'text-primary' : ''}`}>{value}</h2>
          )}
        </div>
        <div className={`p-3 rounded-xl shadow-sm ${alert ? 'bg-primary text-primary-foreground' : 'bg-background border text-muted-foreground'}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}