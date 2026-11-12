"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteWorkspaceCustomer,
  deleteWorkspaceQuote,
  getCurrencies,
  getWorkspaceCustomers,
  getWorkspaceQuote,
  getWorkspaceQuoteSettings,
  getWorkspaceQuotes,
  postWorkspaceCustomers,
  postWorkspaceQuoteDuplicate,
  postWorkspaceQuotes,
  postWorkspaceQuoteSend,
  postWorkspaceQuoteStatus,
  putWorkspaceCustomer,
  putWorkspaceQuote,
  putWorkspaceQuoteSettings,
} from "@/lib/api/endpoints";
import type { CustomerRequest, QuoteResponse, QuoteSettingsRequest, UpdateQuoteRequest } from "@/lib/api/schema";
import { fetchAll } from "@/lib/query/paged";
import { qk } from "@/lib/query/keys";

export type QuoteFilter = { projectId?: string; moduleId?: string; status?: string };

export const useCurrencies = () =>
  useQuery({ queryKey: qk.currencies(), queryFn: () => getCurrencies(), staleTime: Infinity });

export function useQuotes(ws: string, filter: QuoteFilter) {
  return useQuery({
    queryKey: qk.quotes(ws, filter),
    queryFn: () => fetchAll((q) => getWorkspaceQuotes(ws, { ...q, ...filter })),
    enabled: !!ws,
  });
}

export const useQuote = (ws: string, id: string) =>
  useQuery({ queryKey: qk.quote(ws, id), queryFn: () => getWorkspaceQuote(ws, id), enabled: !!ws && !!id });

export function useQuoteMutations(ws: string) {
  const qc = useQueryClient();
  const sync = (q: QuoteResponse) => {
    qc.setQueryData(qk.quote(ws, q.id), q);
    qc.invalidateQueries({ queryKey: ["quotes", ws] });
  };
  return {
    create: useMutation({ mutationFn: (b: { moduleId: string; customerId?: string }) => postWorkspaceQuotes(ws, b), onSuccess: sync }),
    update: useMutation({ mutationFn: ({ id, body }: { id: string; body: UpdateQuoteRequest }) => putWorkspaceQuote(ws, id, body), onSuccess: sync }),
    send: useMutation({ mutationFn: (id: string) => postWorkspaceQuoteSend(ws, id), onSuccess: sync }),
    duplicate: useMutation({ mutationFn: (id: string) => postWorkspaceQuoteDuplicate(ws, id), onSuccess: sync }),
    setStatus: useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => postWorkspaceQuoteStatus(ws, id, { status }), onSuccess: sync }),
    remove: useMutation({ mutationFn: (id: string) => deleteWorkspaceQuote(ws, id), onSuccess: () => qc.invalidateQueries({ queryKey: ["quotes", ws] }) }),
  };
}

export const useCustomers = (ws: string) =>
  useQuery({ queryKey: qk.customers(ws), queryFn: () => getWorkspaceCustomers(ws), enabled: !!ws });

export function useCustomerMutations(ws: string) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: qk.customers(ws) });
  return {
    create: useMutation({ mutationFn: (b: CustomerRequest) => postWorkspaceCustomers(ws, b), onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ id, body }: { id: string; body: CustomerRequest }) => putWorkspaceCustomer(ws, id, body), onSuccess: refresh }),
    remove: useMutation({ mutationFn: (id: string) => deleteWorkspaceCustomer(ws, id), onSuccess: refresh }),
  };
}

export const useQuoteSettings = (ws: string) =>
  useQuery({ queryKey: qk.quoteSettings(ws), queryFn: () => getWorkspaceQuoteSettings(ws), enabled: !!ws });

export function useQuoteSettingsMutation(ws: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: QuoteSettingsRequest) => putWorkspaceQuoteSettings(ws, b),
    onSuccess: (s) => qc.setQueryData(qk.quoteSettings(ws), s),
  });
}
