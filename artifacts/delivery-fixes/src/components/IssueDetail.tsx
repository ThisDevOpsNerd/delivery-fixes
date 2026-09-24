import { useState, useEffect } from 'react';
import { useIssuesStore, type Address } from '@/store/use-issues';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Check, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Clock, 
  Copy, 
  ExternalLink, 
  Mail, 
  MapPin, 
  MessageSquare, 
  Package, 
  ShieldAlert, 
  Zap,
  ArrowRight
} from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function IssueDetail() {
  const { selectedIssueId, issues, updateIssue, resolveIssue, snoozeIssue, markContacted, applySuggestedAddress, selectNextIssue, setSelectedIssueId } = useIssuesStore();
  const { toast } = useToast();
  
  const issue = issues.find(i => i.id === selectedIssueId);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [editAddressData, setEditAddressData] = useState<Address | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  // Reset edit state when issue changes
  useEffect(() => {
    setIsEditingAddress(false);
    if (issue) {
      setEditAddressData({ ...issue.currentAddress });
    }
  }, [issue?.id]);

  if (!issue) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent mb-4">
          <MapPin className="h-8 w-8 opacity-50" />
        </div>
        <h2 className="text-lg font-medium text-foreground">No Issue Selected</h2>
        <p className="text-sm mt-1 max-w-sm text-center">Select an issue from the queue on the left to review and resolve delivery problems.</p>
      </div>
    );
  }

  const isResolved = issue.status === 'resolved';
  const isSnoozed = issue.status === 'snoozed';
  
  const shipByDate = new Date(issue.shipBy);
  const isUrgent = isPast(shipByDate) || isToday(shipByDate);

  const handleSaveAddress = () => {
    if (editAddressData) {
      updateIssue(issue.id, { currentAddress: editAddressData });
      setIsEditingAddress(false);
      toast({
        title: "Address updated manually",
        description: "The address has been saved locally.",
      });
    }
  };

  const handleApplySuggestion = () => {
    applySuggestedAddress(issue.id);
    toast({
      title: "Correction applied",
      description: "Suggested address has been copied to current.",
    });
  };

  const handleResolve = async () => {
    setIsResolving(true);
    try {
      await resolveIssue(issue.id);
      toast({
        title: issue.shopifyOrderId ? "Shopify order updated" : "Demo issue resolved",
        description: issue.shopifyOrderId
          ? "The corrected shipping address is now saved in Shopify."
          : "The issue was resolved locally.",
      });
      setTimeout(() => {
        selectNextIssue();
      }, 800);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not update Shopify",
        description:
          error instanceof Error ? error.message : "Please try the update again.",
      });
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Detail Header */}
      <div className="flex shrink-0 flex-col border-b bg-card py-3 md:py-4">
        
        {/* Mobile Back Button */}
        <div className="md:hidden mb-2 px-4 border-b pb-3">
          <Button variant="ghost" size="sm" className="h-8 gap-1 pl-0 text-muted-foreground" onClick={() => setSelectedIssueId(null)}>
            <ChevronLeft className="h-4 w-4" /> Back to Queue
          </Button>
        </div>

        <div className="flex items-center justify-between px-4 md:px-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <h2 className="font-mono text-lg md:text-xl font-bold tracking-tight">{issue.orderNumber}</h2>
              {isResolved && <Badge variant="outline" className="bg-success/10 text-success border-success/20">Resolved</Badge>}
              {isSnoozed && <Badge variant="outline" className="bg-muted text-muted-foreground">Snoozed</Badge>}
              {issue.status === 'waiting_customer' && <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Waiting on Customer</Badge>}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Package className="h-3.5 w-3.5" /> {issue.itemCount} items (${issue.orderValue.toFixed(2)})</span>
              <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {issue.customerEmail}</span>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-end md:items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 md:h-8 font-mono text-xs gap-1.5" onClick={() => {
              navigator.clipboard.writeText(issue.orderNumber);
              toast({ description: "Order number copied" });
            }}>
              <Copy className="h-3 w-3" /> <span className="hidden md:inline">Copy ID</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 md:h-8 gap-1.5 text-xs"
              disabled={!issue.shopifyAdminUrl}
              onClick={() => {
                if (issue.shopifyAdminUrl) {
                  window.open(issue.shopifyAdminUrl, '_blank', 'noopener,noreferrer');
                }
              }}
            >
              <ExternalLink className="h-3 w-3" /> <span className="hidden md:inline">View in Shopify</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          
          {/* Alert Banner */}
          {!isResolved && (
            <div className={cn(
              "flex gap-4 rounded-md border p-4 shadow-sm",
              issue.severity === 'critical' ? "border-destructive/30 bg-destructive/5" : "border-warning/30 bg-warning/5"
            )}>
              <div className="mt-0.5">
                {issue.severity === 'critical' ? (
                  <ShieldAlert className="h-5 w-5 text-destructive" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-warning" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={cn(
                  "text-sm font-semibold",
                  issue.severity === 'critical' ? "text-destructive" : "text-amber-800 dark:text-warning"
                )}>
                  {issue.issueType.replace(/_/g, ' ').toUpperCase()}
                </h3>
                <p className="mt-1 text-sm">{issue.reason}</p>
                
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 border shadow-sm">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Ship by:</span>
                    <span className={cn(isUrgent && "text-destructive font-bold")}>
                      {format(shipByDate, 'MMM d, yyyy')} {isUrgent && "(Urgent)"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 border shadow-sm">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Carrier:</span>
                    <span>{issue.carrier}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Address Workspace */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            
            {/* Current Address */}
            <div className="flex flex-col rounded-md border bg-card shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Current Address
                </h3>
                {!isEditingAddress && !isResolved && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsEditingAddress(true)}>
                    Edit manually
                  </Button>
                )}
              </div>
              
              <div className="p-4 flex-1">
                {isEditingAddress && editAddressData ? (
                  <div className="space-y-3">
                    <Input 
                      value={editAddressData.name} 
                      onChange={e => setEditAddressData({...editAddressData, name: e.target.value})} 
                      placeholder="Name" className="h-8 text-sm"
                    />
                    <Input 
                      value={editAddressData.line1} 
                      onChange={e => setEditAddressData({...editAddressData, line1: e.target.value})} 
                      placeholder="Address Line 1" className="h-8 text-sm"
                    />
                    <Input 
                      value={editAddressData.line2 || ''} 
                      onChange={e => setEditAddressData({...editAddressData, line2: e.target.value})} 
                      placeholder="Apt, Suite, etc. (optional)" className="h-8 text-sm"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input 
                        value={editAddressData.city} 
                        onChange={e => setEditAddressData({...editAddressData, city: e.target.value})} 
                        placeholder="City" className="h-8 text-sm"
                      />
                      <Input 
                        value={editAddressData.province} 
                        onChange={e => setEditAddressData({...editAddressData, province: e.target.value})} 
                        placeholder="State/Province" className="h-8 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input 
                        value={editAddressData.postalCode} 
                        onChange={e => setEditAddressData({...editAddressData, postalCode: e.target.value})} 
                        placeholder="ZIP/Postal Code" className="h-8 text-sm"
                      />
                      <Input 
                        value={editAddressData.country} 
                        onChange={e => setEditAddressData({...editAddressData, country: e.target.value})} 
                        placeholder="Country" className="h-8 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Button size="sm" onClick={handleSaveAddress} className="w-full">Save Changes</Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditingAddress(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded border bg-background/50 p-3 font-mono text-sm">
                    <div>{issue.currentAddress.name}</div>
                    <div>{issue.currentAddress.line1}</div>
                    {issue.currentAddress.line2 && <div className="text-destructive font-semibold bg-destructive/10 px-1 inline-block mt-0.5 rounded-sm">{issue.currentAddress.line2}</div>}
                    {!issue.currentAddress.line2 && issue.issueType === 'missing_apartment' && (
                      <div className="text-destructive font-semibold bg-destructive/10 px-1 inline-block mt-0.5 rounded-sm">[MISSING APT/SUITE]</div>
                    )}
                    <div>{issue.currentAddress.city}, {issue.currentAddress.province} {issue.currentAddress.postalCode}</div>
                    <div>{issue.currentAddress.country}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Suggested Address */}
            <div className="flex flex-col rounded-md border bg-card shadow-sm overflow-hidden border-primary/20">
              <div className="flex items-center justify-between border-b border-primary/10 bg-primary/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" fill="currentColor" />
                  <h3 className="text-sm font-semibold text-primary">Suggested Correction</h3>
                </div>
                {issue.suggestedAddress && (
                  <Badge variant="outline" className="bg-background text-xs font-mono">
                    {(issue.confidence * 100).toFixed(0)}% Match
                  </Badge>
                )}
              </div>
              
              <div className="p-4 flex flex-col justify-between flex-1">
                {issue.suggestedAddress ? (
                  <>
                    <div className="rounded border border-primary/20 bg-background/50 p-3 font-mono text-sm shadow-sm relative">
                      <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-success/20 text-success">
                        <Check className="h-3 w-3" />
                      </div>
                      <div className={issue.currentAddress.name !== issue.suggestedAddress.name ? "text-primary font-medium" : ""}>
                        {issue.suggestedAddress.name}
                      </div>
                      <div className={issue.currentAddress.line1 !== issue.suggestedAddress.line1 ? "text-primary font-medium" : ""}>
                        {issue.suggestedAddress.line1}
                      </div>
                      {issue.suggestedAddress.line2 && (
                        <div className={issue.currentAddress.line2 !== issue.suggestedAddress.line2 ? "text-primary font-medium" : ""}>
                          {issue.suggestedAddress.line2}
                        </div>
                      )}
                      <div className={(issue.currentAddress.city !== issue.suggestedAddress.city || issue.currentAddress.province !== issue.suggestedAddress.province || issue.currentAddress.postalCode !== issue.suggestedAddress.postalCode) ? "text-primary font-medium" : ""}>
                        {issue.suggestedAddress.city}, {issue.suggestedAddress.province} {issue.suggestedAddress.postalCode}
                      </div>
                      <div className={issue.currentAddress.country !== issue.suggestedAddress.country ? "text-primary font-medium" : ""}>
                        {issue.suggestedAddress.country}
                      </div>
                    </div>
                    
                    {!isResolved && (
                      <Button onClick={handleApplySuggestion} className="w-full mt-4 gap-2 font-medium">
                        <ArrowRight className="h-4 w-4" /> Apply Correction
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground p-4">
                    <ShieldAlert className="h-8 w-8 mb-2 opacity-20" />
                    <p className="text-sm">No automated correction available for this address.</p>
                    <p className="text-xs mt-1">Manual intervention required.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Issue Timeline</h3>
            <div className="rounded-md border bg-card p-4 space-y-4 shadow-sm">
              {issue.timeline.map((event, idx) => (
                <div key={idx} className="flex gap-4 relative">
                  {idx !== issue.timeline.length - 1 && (
                    <div className="absolute left-[11px] top-6 bottom-[-16px] w-px bg-border"></div>
                  )}
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background mt-0.5 z-10">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                  </div>
                  <div className="flex flex-col pt-0.5">
                    <span className="text-sm font-medium">{event.message}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(event.date), 'MMM d, h:mm a')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Action Footer */}
      {!isResolved && (
        <div className="shrink-0 border-t bg-card p-3 md:p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
          <div className="mx-auto flex max-w-4xl flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex w-full md:w-auto items-center justify-between md:justify-start gap-2">
              <Button variant="outline" className="w-full md:w-auto gap-2 text-muted-foreground font-medium" onClick={() => snoozeIssue(issue.id)}>
                <Clock className="h-4 w-4" /> <span className="hidden sm:inline">Snooze 24h</span><span className="sm:hidden">Snooze</span>
              </Button>
              <Button variant="outline" className="w-full md:w-auto gap-2 text-muted-foreground font-medium" onClick={() => {
                markContacted(issue.id);
                toast({ title: "Status updated", description: "Marked as waiting on customer." });
              }}>
                <MessageSquare className="h-4 w-4" /> <span className="hidden sm:inline">Mark Contacted</span><span className="sm:hidden">Contacted</span>
              </Button>
            </div>
            
            <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-3">
              <div className="hidden lg:block text-xs text-muted-foreground mr-2 font-medium">Ready to sync back to Shopify?</div>
              <Button
                size="lg"
                className="flex-1 md:flex-none bg-success text-success-foreground hover:bg-success/90 gap-2 font-semibold shadow-md"
                onClick={handleResolve}
                disabled={isResolving}
              >
                <CheckCircle2 className="h-5 w-5" />
                {isResolving ? 'Updating Shopify…' : 'Resolve'}
                {!isResolving && <span className="hidden sm:inline">{issue.shopifyOrderId ? '& Update Order' : 'Demo Issue'}</span>}
              </Button>
              <Button variant="ghost" size="icon" className="shrink-0" onClick={selectNextIssue} title="Skip to next">
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {isResolved && (
        <div className="shrink-0 border-t bg-success/5 p-4 z-20 flex justify-center items-center">
          <Button variant="outline" onClick={selectNextIssue} className="gap-2 bg-background">
            Next Issue <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
