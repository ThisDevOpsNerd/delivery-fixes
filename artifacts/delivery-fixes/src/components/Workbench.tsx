import { useEffect } from 'react';
import { useIssuesStore, type IssueStatus, type IssueSeverity } from '@/store/use-issues';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, isPast, isToday, formatDistanceToNow } from 'date-fns';
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Package, 
  Mail, 
  MapPin, 
  Info,
  ArrowRight,
  ChevronRight,
  ShieldAlert,
  Inbox
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { IssueDetail } from '@/components/IssueDetail';

export function Workbench() {
  const { 
    issues, 
    selectedIssueId, 
    searchQuery, 
    statusFilter, 
    severityFilter,
    dataSource,
    shopName,
    syncedAt,
    syncStatus,
    syncError,
    setSearchQuery,
    setStatusFilter,
    setSeverityFilter,
    setSelectedIssueId,
    resetToDemoData,
    syncFromShopify,
  } = useIssuesStore();

  useEffect(() => {
    void syncFromShopify().catch(() => undefined);
  }, [syncFromShopify]);

  // Derived filtered issues
  const filteredIssues = issues.filter(issue => {
    if (statusFilter !== 'all' && issue.status !== statusFilter) return false;
    if (severityFilter !== 'all' && issue.severity !== severityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return issue.orderNumber.toLowerCase().includes(q) || 
             issue.customerName.toLowerCase().includes(q) ||
             issue.customerEmail.toLowerCase().includes(q);
    }
    return true;
  });

  const handleRefresh = async () => {
    await syncFromShopify().catch(() => undefined);
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Top Header */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-card px-3 md:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Package className="h-5 w-5" />
          </div>
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">Delivery Fixes</span>
          <Badge variant="secondary" className="font-mono text-[9px] uppercase tracking-wider sm:ml-2 sm:text-[10px]">
            {dataSource === 'live' ? `${shopName || 'Shopify'} Live` : 'Demo Data'}
          </Badge>
        </div>
        
        <div className="flex shrink-0 items-center gap-2 md:gap-4">
          <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
            <Clock className="h-3 w-3" />
            <span>
              {syncError
                ? 'Sync failed'
                : syncedAt
                  ? `Last sync: ${formatDistanceToNow(new Date(syncedAt), { addSuffix: true })}`
                  : 'Not synced yet'}
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-2 text-xs"
            onClick={handleRefresh}
            disabled={syncStatus === 'syncing'}
          >
            <svg 
              className={cn("h-3 w-3", syncStatus === 'syncing' && "animate-spin")} 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21v-5h5" />
            </svg>
            {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Queue'}
          </Button>
          <Button variant="ghost" size="sm" className="hidden h-8 text-xs text-muted-foreground lg:inline-flex" onClick={resetToDemoData}>
            Load Demo Data
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Queue */}
        <div className={cn(
          "flex w-full flex-col border-r bg-card/50 md:w-[380px] lg:w-[420px]",
          selectedIssueId ? "hidden md:flex" : "flex"
        )}>
          {/* Filters Area */}
          <div className="flex flex-col gap-3 border-b p-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search"
                placeholder="Search orders, customers..." 
                className="h-9 w-full bg-background pl-9 text-sm shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <select 
                className="h-8 rounded-md border bg-background px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">All Statuses</option>
                <option value="open">Open Issues</option>
                <option value="waiting_customer">Waiting on Customer</option>
                <option value="snoozed">Snoozed</option>
                <option value="resolved">Resolved</option>
              </select>

              <select 
                className="h-8 rounded-md border bg-background px-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical (Failing)</option>
                <option value="warning">Warning (Fixable)</option>
                <option value="review">Review (Manual)</option>
              </select>
            </div>
          </div>

          {/* Queue List */}
          <div className="flex-1 overflow-y-auto">
            {filteredIssues.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <Inbox className="mb-4 h-10 w-10 opacity-20" />
                <p className="text-sm font-medium">
                  {dataSource === 'live' && !syncError
                    ? 'No delivery fixes needed'
                    : syncError
                      ? 'Shopify sync failed'
                      : 'Queue is empty'}
                </p>
                <p className="mt-1 max-w-xs text-xs">
                  {dataSource === 'live' && !syncError
                    ? 'No obvious address exceptions were found in open, unfulfilled Shopify orders.'
                    : syncError || 'No issues match your current filters.'}
                </p>
                {dataSource === 'live' && !syncError && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 text-xs"
                    onClick={resetToDemoData}
                  >
                    Preview with demo issues
                  </Button>
                )}
                {(statusFilter !== 'open' || severityFilter !== 'all' || searchQuery !== '') && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="mt-4 h-auto p-0 text-xs"
                    onClick={() => {
                      setStatusFilter('open');
                      setSeverityFilter('all');
                      setSearchQuery('');
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-px bg-border">
                {filteredIssues.map((issue) => (
                  <button
                    key={issue.id}
                    onClick={() => setSelectedIssueId(issue.id)}
                    className={cn(
                      "flex flex-col gap-2 bg-card p-4 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring",
                      selectedIssueId === issue.id && "bg-accent/80 border-l-4 border-l-primary pl-[12px]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold">{issue.orderNumber}</span>
                        {issue.severity === 'critical' && <ShieldAlert className="h-3.5 w-3.5 text-destructive" />}
                        {issue.severity === 'warning' && <AlertTriangle className="h-3.5 w-3.5 text-warning" />}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <div className="text-sm font-medium">{issue.customerName}</div>
                    
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <Badge variant="outline" className="text-[10px] font-normal rounded-sm">
                        {issue.issueType.replace(/_/g, ' ')}
                      </Badge>
                      {issue.status === 'open' ? (
                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-medium rounded-sm border-0">Needs Action</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] font-normal rounded-sm bg-muted text-muted-foreground border-transparent">
                          {issue.status.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Detail Pane */}
        <div className={cn(
          "flex-1 flex-col bg-background",
          selectedIssueId ? "flex" : "hidden md:flex"
        )}>
          <IssueDetail />
        </div>
      </div>
    </div>
  );
}
