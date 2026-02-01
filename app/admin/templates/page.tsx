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

export default function NotificationTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch('/api/v1/admin/templates')
      .then((res) => {
        if (!res.ok) throw new Error('network')
        return res.json()
      })
      .then(setTemplates)
      .catch(() => setError('Failed to load templates.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Notification Templates</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Template ID</TableHead>
            <TableHead>Channel</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Body</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((t: any) => (
            <TableRow key={t.templateId}>
              <TableCell>{t.templateId}</TableCell>
              <TableCell>{t.channel}</TableCell>
              <TableCell>{t.subject}</TableCell>
              <TableCell>{t.body}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Add/Edit UI can be added here */}
    </div>
  );
}
