"use client";
import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LoadingSpinner, ErrorAlert } from '@/components/ui/loading-error'
import { formatErrorMessage } from '@/lib/api-helpers'
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

export default function PaymentConfigsPage() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processingItem, setProcessingItem] = useState<string | null>(null);

  const [showNew, setShowNew] = useState(false);
  const [newConfig, setNewConfig] = useState<any>({
    category: "CASH_ON_COLLECTION",
    type: "UPI",
    displayName: "",
    description: "",
    iconUrl: "",
    isEnabled: true,
    surchargePercentage: 0,
    inputTemplate: "",
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  useEffect(() => {
    apiFetch('/api/v1/admin/payments/payment-configs')
      .then((res) => {
        if (!res.ok) throw new Error('network')
        return res.json()
      })
      .then(setConfigs)
      .catch((e) => { const msg = formatErrorMessage(e); setError(msg); toast.error(msg); })
      .finally(() => setLoading(false))
  }, [])

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/v1/admin/payments/payment-configs');
      if (!res.ok) throw new Error('network');
      const data = await res.json();
      setConfigs(data);
    } catch (e) {
      const msg = formatErrorMessage(e)
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setProcessing(true);
    try {
      const res = await apiFetch('/api/v1/admin/payments/payment-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      if (!res.ok) {
        let msg = 'create-failed';
        try { const body = await res.json(); msg = body?.message || res.statusText; } catch (e) { }
        throw new Error(msg);
      }
      setShowNew(false);
      setNewConfig({
        category: 'CASH_ON_COLLECTION',
        type: 'UPI',
        displayName: '',
        description: '',
        iconUrl: '',
        isEnabled: true,
        surchargePercentage: 0,
        inputTemplate: '',
      });
      toast.success('Payment config created');
      await reload();
    } catch (err: any) {
      const msg = formatErrorMessage(err) || (err?.message || 'Failed to create payment config.')
      setError(msg);
      toast.error('Create failed: ' + msg);
    } finally {
      setProcessing(false);
    }
  }

  async function handleSaveEdit(type: string) {
    setProcessingItem(type);
    try {
      const res = await apiFetch(`/api/v1/admin/payments/payment-configs/${type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editValues),
      });
      if (!res.ok) {
        let msg = 'update-failed';
        try { const body = await res.json(); msg = body?.message || res.statusText; } catch (e) { }
        throw new Error(msg);
      }
      setEditing(null);
      setEditValues({});
      toast.success('Payment config updated');
      await reload();
    } catch (err: any) {
      const msg = formatErrorMessage(err) || (err?.message || 'Failed to update payment config.')
      setError(msg);
      toast.error('Update failed: ' + msg);
    } finally {
      setProcessingItem(null);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Payment Configurations</h1>
      {loading && <div className="py-6"><LoadingSpinner text="Loading payment configs..." /></div>}
      <div className="flex items-center justify-between mb-4">
        <div />
        <div>
          <Button className="mr-2" onClick={() => setShowNew((v) => !v)}>
            {showNew ? "Cancel" : "New Payment Config"}
          </Button>
        </div>
      </div>

      {showNew && (
        <form onSubmit={handleCreate} className="mb-4 p-4 border rounded">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col">
              <span>Category</span>
              <Select value={newConfig.category} onValueChange={(v: string) => setNewConfig({ ...newConfig, category: v })}>
                <SelectTrigger className="mt-1" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONLINE_PREPAID">ONLINE_PREPAID</SelectItem>
                  <SelectItem value="CASH_ON_COLLECTION">CASH_ON_COLLECTION</SelectItem>
                  <SelectItem value="POS_OFFLINE">POS_OFFLINE</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="flex flex-col">
              <span>Type</span>
              <Select value={newConfig.type} onValueChange={(v: string) => setNewConfig({ ...newConfig, type: v })}>
                <SelectTrigger className="mt-1" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="CREDIT_CARD">CREDIT_CARD</SelectItem>
                  <SelectItem value="DEBIT_CARD">DEBIT_CARD</SelectItem>
                  <SelectItem value="NET_BANKING">NET_BANKING</SelectItem>
                  <SelectItem value="WALLET">WALLET</SelectItem>
                  <SelectItem value="CASH">CASH</SelectItem>
                  <SelectItem value="LOYALTY_POINTS">LOYALTY_POINTS</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="flex flex-col">
              <span>Display Name</span>
              <Input className="mt-1" value={newConfig.displayName} onChange={(e: any) => setNewConfig({ ...newConfig, displayName: e.target.value })} />
            </label>
            <label className="flex flex-col">
              <span>Description</span>
              <Input className="mt-1" value={newConfig.description} onChange={(e: any) => setNewConfig({ ...newConfig, description: e.target.value })} />
            </label>
            <label className="flex flex-col">
              <span>Icon URL</span>
              <Input className="mt-1" value={newConfig.iconUrl} onChange={(e: any) => setNewConfig({ ...newConfig, iconUrl: e.target.value })} />
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={newConfig.isEnabled} onChange={(e) => setNewConfig({ ...newConfig, isEnabled: e.target.checked })} />
              <span>Enabled</span>
            </label>
            <label className="flex flex-col">
              <span>Surcharge %</span>
              <Input type="number" className="mt-1" value={String(newConfig.surchargePercentage)} onChange={(e: any) => setNewConfig({ ...newConfig, surchargePercentage: Number(e.target.value) })} />
            </label>
            <label className="flex flex-col col-span-2">
              <span>Input Template</span>
              <Input className="mt-1" value={newConfig.inputTemplate} onChange={(e: any) => setNewConfig({ ...newConfig, inputTemplate: e.target.value })} />
            </label>
          </div>
          <div className="mt-3">
            <Button type="submit">Create</Button>
          </div>
        </form>
      )}

      {error && <ErrorAlert error={error} onRetry={reload} />}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Display Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Enabled</TableHead>
            <TableHead>Surcharge %</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {configs.map((c: any) => {
            return (
              <TableRow key={c.type}>
                <TableCell>
                  {editing === c.type ? (
                    <input value={editValues.type ?? c.type} disabled className="w-36" />
                  ) : (
                    c.type
                  )}
                </TableCell>
                <TableCell>
                  {editing === c.type ? (
                    <input value={editValues.displayName ?? c.displayName} onChange={(e) => setEditValues({ ...editValues, displayName: e.target.value })} />
                  ) : (
                    c.displayName
                  )}
                </TableCell>
                <TableCell>
                  {editing === c.type ? (
                    <input value={editValues.description ?? c.description} onChange={(e) => setEditValues({ ...editValues, description: e.target.value })} />
                  ) : (
                    c.description
                  )}
                </TableCell>
                <TableCell>
                  {editing === c.type ? (
                    <input type="checkbox" checked={editValues.isEnabled ?? c.isEnabled} onChange={(e) => setEditValues({ ...editValues, isEnabled: e.target.checked })} />
                  ) : (
                    <span className={c.isEnabled ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{c.isEnabled ? 'Enabled' : 'Disabled'}</span>
                  )}
                </TableCell>
                <TableCell>
                  {editing === c.type ? (
                    <input type="number" value={editValues.surchargePercentage ?? c.surchargePercentage} onChange={(e) => setEditValues({ ...editValues, surchargePercentage: Number(e.target.value) })} className="w-20" />
                  ) : (
                    c.surchargePercentage
                  )}
                </TableCell>
                <TableCell>
                  {editing === c.type ? (
                    <>
                      <Button variant="default" size="sm" className="mr-2" onClick={() => handleSaveEdit(c.type)} disabled={processing || processingItem === c.type}>
                        {processingItem === c.type ? 'Saving...' : 'Save'}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setEditing(null); setEditValues({}); }} disabled={processing || processingItem === c.type}>Cancel</Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => { setEditing(c.type); setEditValues(c); }} disabled={processing}>Edit</Button>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {/* Add/Edit UI can be added here */}
    </div>
  );
}
