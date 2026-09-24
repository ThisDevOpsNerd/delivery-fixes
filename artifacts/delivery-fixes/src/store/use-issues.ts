import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays, subDays } from 'date-fns';
import {
  listDeliveryIssues,
  resolveDeliveryIssue,
} from '@workspace/api-client-react';

export type IssueStatus = 'open' | 'waiting_customer' | 'snoozed' | 'resolved';
export type IssueSeverity = 'critical' | 'warning' | 'review';
export type IssueType = 'address_invalid' | 'missing_apartment' | 'carrier_rejected' | 'zip_mismatch' | 'po_box_unsupported';

export interface Address {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface DeliveryIssue {
  id: string;
  shopifyOrderId?: string;
  shopifyAdminUrl?: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  issueType: IssueType;
  severity: IssueSeverity;
  status: IssueStatus;
  createdAt: string;
  shipBy: string;
  carrier: string;
  itemCount: number;
  orderValue: number;
  currencyCode?: string;
  currentAddress: Address;
  suggestedAddress?: Address;
  confidence: number;
  reason: string;
  timeline: { date: string; message: string }[];
}

const mockIssues: DeliveryIssue[] = [
  {
    id: 'iss_101',
    orderNumber: '#14092',
    customerName: 'Sarah Jenkins',
    customerEmail: 'sarah.j@example.com',
    issueType: 'missing_apartment',
    severity: 'critical',
    status: 'open',
    createdAt: subDays(new Date(), 1).toISOString(),
    shipBy: addDays(new Date(), 0).toISOString(),
    carrier: 'USPS Priority',
    itemCount: 3,
    orderValue: 145.50,
    currentAddress: {
      name: 'Sarah Jenkins',
      line1: '400 Broad St',
      line2: '',
      city: 'Seattle',
      province: 'WA',
      postalCode: '98109',
      country: 'US'
    },
    suggestedAddress: {
      name: 'Sarah Jenkins',
      line1: '400 Broad St',
      line2: 'Apt ',
      city: 'Seattle',
      province: 'WA',
      postalCode: '98109-4321',
      country: 'US'
    },
    confidence: 0.85,
    reason: 'USPS database indicates this is a multi-dwelling building. Missing apartment or suite number.',
    timeline: [
      { date: subDays(new Date(), 1).toISOString(), message: 'Order placed' },
      { date: subDays(new Date(), 1).toISOString(), message: 'Address validation failed (Severity: High)' }
    ]
  },
  {
    id: 'iss_102',
    orderNumber: '#14088',
    customerName: 'Marcus Wright',
    customerEmail: 'mwright99@gmail.com',
    issueType: 'zip_mismatch',
    severity: 'warning',
    status: 'open',
    createdAt: subDays(new Date(), 2).toISOString(),
    shipBy: addDays(new Date(), 1).toISOString(),
    carrier: 'FedEx Ground',
    itemCount: 1,
    orderValue: 89.99,
    currentAddress: {
      name: 'Marcus Wright',
      line1: '1234 Elm Street',
      city: 'Austin',
      province: 'TX',
      postalCode: '78701',
      country: 'US'
    },
    suggestedAddress: {
      name: 'Marcus Wright',
      line1: '1234 Elm Street',
      city: 'Austin',
      province: 'TX',
      postalCode: '78704',
      country: 'US'
    },
    confidence: 0.98,
    reason: 'ZIP code 78701 does not match street address 1234 Elm Street (expected 78704).',
    timeline: [
      { date: subDays(new Date(), 2).toISOString(), message: 'Order placed' },
      { date: subDays(new Date(), 2).toISOString(), message: 'Flagged for ZIP code mismatch' }
    ]
  },
  {
    id: 'iss_103',
    orderNumber: '#14085',
    customerName: 'Elena Rostova',
    customerEmail: 'elena.r@corporate.net',
    issueType: 'po_box_unsupported',
    severity: 'critical',
    status: 'open',
    createdAt: subDays(new Date(), 2).toISOString(),
    shipBy: addDays(new Date(), 0).toISOString(),
    carrier: 'UPS 2nd Day Air',
    itemCount: 5,
    orderValue: 450.00,
    currentAddress: {
      name: 'Elena Rostova',
      line1: 'PO Box 4492',
      city: 'Denver',
      province: 'CO',
      postalCode: '80204',
      country: 'US'
    },
    confidence: 1.0,
    reason: 'UPS cannot deliver to PO Boxes. A physical street address is required.',
    timeline: [
      { date: subDays(new Date(), 2).toISOString(), message: 'Order placed' },
      { date: subDays(new Date(), 1).toISOString(), message: 'Carrier rejection: UPS PO Box policy' }
    ]
  },
  {
    id: 'iss_104',
    orderNumber: '#14070',
    customerName: 'David Chen',
    customerEmail: 'dchen.design@outlook.com',
    issueType: 'address_invalid',
    severity: 'review',
    status: 'waiting_customer',
    createdAt: subDays(new Date(), 4).toISOString(),
    shipBy: subDays(new Date(), 1).toISOString(),
    carrier: 'USPS First Class',
    itemCount: 2,
    orderValue: 34.00,
    currentAddress: {
      name: 'David Chen',
      line1: '999 Unknown Ave',
      city: 'Nowhere',
      province: 'CA',
      postalCode: '90210',
      country: 'US'
    },
    confidence: 0.1,
    reason: 'Address completely unrecognized by carrier databases.',
    timeline: [
      { date: subDays(new Date(), 4).toISOString(), message: 'Order placed' },
      { date: subDays(new Date(), 3).toISOString(), message: 'Email sent to customer requesting updated address' }
    ]
  },
  {
    id: 'iss_105',
    orderNumber: '#14102',
    customerName: 'Aisha Patel',
    customerEmail: 'apatel2020@yahoo.com',
    issueType: 'address_invalid',
    severity: 'warning',
    status: 'open',
    createdAt: subDays(new Date(), 1).toISOString(),
    shipBy: addDays(new Date(), 2).toISOString(),
    carrier: 'FedEx Home Delivery',
    itemCount: 1,
    orderValue: 120.00,
    currentAddress: {
      name: 'Aisha Patel',
      line1: '1600 Amphitheater',
      city: 'Mountain View',
      province: 'CA',
      postalCode: '94043',
      country: 'US'
    },
    suggestedAddress: {
      name: 'Aisha Patel',
      line1: '1600 Amphitheatre Pkwy',
      city: 'Mountain View',
      province: 'CA',
      postalCode: '94043-1351',
      country: 'US'
    },
    confidence: 0.95,
    reason: 'Street suffix missing and spelling correction applied.',
    timeline: [
      { date: subDays(new Date(), 1).toISOString(), message: 'Order placed' },
      { date: subDays(new Date(), 1).toISOString(), message: 'Standardized by FedEx Address Validation' }
    ]
  }
];

interface IssuesState {
  issues: DeliveryIssue[];
  dataSource: 'live' | 'demo';
  shopName: string | null;
  syncedAt: string | null;
  syncStatus: 'idle' | 'syncing' | 'error';
  syncError: string | null;
  selectedIssueId: string | null;
  searchQuery: string;
  statusFilter: IssueStatus | 'all';
  severityFilter: IssueSeverity | 'all';
  
  setSearchQuery: (q: string) => void;
  setStatusFilter: (s: IssueStatus | 'all') => void;
  setSeverityFilter: (s: IssueSeverity | 'all') => void;
  setSelectedIssueId: (id: string | null) => void;
  
  updateIssue: (id: string, updates: Partial<DeliveryIssue>) => void;
  resolveIssue: (id: string) => Promise<void>;
  snoozeIssue: (id: string) => void;
  markContacted: (id: string) => void;
  applySuggestedAddress: (id: string) => void;
  
  // Navigation
  selectNextIssue: () => void;
  
  // Utility
  syncFromShopify: () => Promise<void>;
  resetToDemoData: () => void;
}

export const useIssuesStore = create<IssuesState>()(
  persist(
    (set, get) => ({
      issues: mockIssues,
      dataSource: 'demo',
      shopName: null,
      syncedAt: null,
      syncStatus: 'idle',
      syncError: null,
      selectedIssueId: mockIssues[0]?.id ?? null,
      searchQuery: '',
      statusFilter: 'open',
      severityFilter: 'all',
      
      setSearchQuery: (q) => set({ searchQuery: q }),
      setStatusFilter: (s) => set({ statusFilter: s }),
      setSeverityFilter: (s) => set({ severityFilter: s }),
      setSelectedIssueId: (id) => set({ selectedIssueId: id }),
      
      updateIssue: (id, updates) => set((state) => ({
        issues: state.issues.map(i => i.id === id ? { ...i, ...updates } : i)
      })),
      
      resolveIssue: async (id) => {
        const issue = get().issues.find((item) => item.id === id);
        if (!issue) return;

        if (issue.shopifyOrderId) {
          await resolveDeliveryIssue({
            shopifyOrderId: issue.shopifyOrderId,
            address: issue.currentAddress,
          });
        }

        set((state) => ({
          issues: state.issues.map(i => i.id === id ? {
            ...i,
            status: 'resolved',
            timeline: [...i.timeline, {
              date: new Date().toISOString(),
              message: issue.shopifyOrderId
                ? 'Corrected shipping address saved to Shopify'
                : 'Issue resolved in demo mode',
            }]
          } : i)
        }));
      },
      
      snoozeIssue: (id) => set((state) => ({
        issues: state.issues.map(i => i.id === id ? { 
          ...i, 
          status: 'snoozed',
          timeline: [...i.timeline, { date: new Date().toISOString(), message: 'Issue snoozed' }]
        } : i)
      })),
      
      markContacted: (id) => set((state) => ({
        issues: state.issues.map(i => i.id === id ? { 
          ...i, 
          status: 'waiting_customer',
          timeline: [...i.timeline, { date: new Date().toISOString(), message: 'Customer contacted' }]
        } : i)
      })),
      
      applySuggestedAddress: (id) => set((state) => {
        const issue = state.issues.find(i => i.id === id);
        if (!issue || !issue.suggestedAddress) return state;
        const suggestedAddress: Address = issue.suggestedAddress;
        
        return {
          issues: state.issues.map(i => i.id === id ? { 
            ...i, 
            currentAddress: { ...suggestedAddress },
            timeline: [...i.timeline, { date: new Date().toISOString(), message: 'Applied suggested address correction' }]
          } : i)
        };
      }),
      
      selectNextIssue: () => {
        const { issues, selectedIssueId, statusFilter, severityFilter, searchQuery } = get();
        
        // Find visible issues (same logic as the view)
        const visibleIssues = issues.filter(issue => {
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
        
        if (visibleIssues.length === 0) {
          set({ selectedIssueId: null });
          return;
        }
        
        if (!selectedIssueId) {
          set({ selectedIssueId: visibleIssues[0].id });
          return;
        }
        
        const currentIndex = visibleIssues.findIndex(i => i.id === selectedIssueId);
        if (currentIndex === -1 || currentIndex === visibleIssues.length - 1) {
          // If not found in filtered list or at the end, just wrap to first or null
          set({ selectedIssueId: visibleIssues.length > 0 ? visibleIssues[0].id : null });
        } else {
          set({ selectedIssueId: visibleIssues[currentIndex + 1].id });
        }
      },

      syncFromShopify: async () => {
        set({ syncStatus: 'syncing', syncError: null });
        try {
          const queue = await listDeliveryIssues();
          const issues: DeliveryIssue[] = queue.issues.map((issue) => ({
            ...issue,
            suggestedAddress: issue.suggestedAddress ?? undefined,
          }));
          set({
            issues,
            dataSource: 'live',
            shopName: queue.shopName,
            syncedAt: queue.syncedAt,
            syncStatus: 'idle',
            syncError: null,
            selectedIssueId: issues[0]?.id ?? null,
            statusFilter: 'open',
          });
        } catch (error) {
          set({
            syncStatus: 'error',
            syncError:
              error instanceof Error
                ? error.message
                : 'Could not sync Shopify orders',
          });
          throw error;
        }
      },
      
      resetToDemoData: () => set({ 
        issues: mockIssues, 
        dataSource: 'demo',
        shopName: null,
        syncedAt: null,
        syncStatus: 'idle',
        syncError: null,
        selectedIssueId: mockIssues[0]?.id ?? null,
        statusFilter: 'open',
        severityFilter: 'all',
        searchQuery: '' 
      })
    }),
    {
      name: 'delivery-fixes-storage-v2',
    }
  )
);
