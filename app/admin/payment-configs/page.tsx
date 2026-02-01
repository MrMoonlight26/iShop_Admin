"use client";
import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-config";
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
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch('/api/v1/admin/payment-configs')
      .then((res) => {
        if (!res.ok) throw new Error('network')
        return res.json()
      })
      .then(setConfigs)
      .catch(() => setError('Failed to load payment configs.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Payment Configurations</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Display Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Enabled</TableHead>
            <TableHead>Surcharge %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {configs.map((c: any) => (
            <TableRow key={c.type}>
              <TableCell>{c.type}</TableCell>
              <TableCell>{c.displayName}</TableCell>
              <TableCell>{c.description}</TableCell>
              <TableCell>{c.isEnabled ? "Yes" : "No"}</TableCell>
              <TableCell>{c.surchargePercentage}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Add/Edit UI can be added here */}
    </div>
  );
}
