"use client";
import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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

  const [showNew, setShowNew] = useState(false);
  const [newTemplate, setNewTemplate] = useState<any>({ templateId: '', channel: 'EMAIL', subject: '', body: '' });
  const [editing, setEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  async function reload() {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/v1/admin/templates');
      if (!res.ok) throw new Error('network');
      const data = await res.json();
      setTemplates(data);
    } catch (e) {
      setError('Failed to load templates.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/v1/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate),
      });
      if (!res.ok) throw new Error('create-failed');
      setShowNew(false);
      setNewTemplate({ templateId: '', channel: 'EMAIL', subject: '', body: '' });
      await reload();
    } catch (err) {
      setError('Failed to create template.');
    }
  }

  async function handleSaveEdit(templateId: string) {
    try {
      const res = await apiFetch(`/api/v1/admin/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editValues),
      });
      if (!res.ok) throw new Error('update-failed');
      setEditing(null);
      setEditValues({});
      await reload();
    } catch (err) {
      setError('Failed to update template.');
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Notification Templates</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div className="flex items-center justify-between mb-4">
        <div />
        <div>
          <Button onClick={() => setShowNew((v) => !v)}>{showNew ? 'Cancel' : 'New Template'}</Button>
        </div>
      </div>

      {showNew && (
        <form onSubmit={handleCreate} className="mb-4 p-4 border rounded">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col">
              <span>Template ID</span>
              <Input value={newTemplate.templateId} onChange={(e: any) => setNewTemplate({ ...newTemplate, templateId: e.target.value })} className="mt-1" />
            </label>
            <label className="flex flex-col">
              <span>Channel</span>
              <Select value={newTemplate.channel} onValueChange={(v: string) => setNewTemplate({ ...newTemplate, channel: v })}>
                <SelectTrigger className="mt-1" size="sm">
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMAIL">EMAIL</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="PUSH_NOTIFICATION">PUSH_NOTIFICATION</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="flex flex-col col-span-2">
              <span>Subject</span>
              <Input value={newTemplate.subject} onChange={(e: any) => setNewTemplate({ ...newTemplate, subject: e.target.value })} className="mt-1" />
            </label>
            <label className="flex flex-col col-span-2">
              <span>Body</span>
              <textarea value={newTemplate.body} onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })} className="mt-1 p-2 border rounded" />
            </label>
          </div>
          <div className="mt-3">
            <Button type="submit">Create</Button>
          </div>
        </form>
      )}

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
              <TableCell>
                {editing === t.templateId ? (
                  <Input disabled value={editValues.templateId ?? t.templateId} className="w-40" />
                ) : (
                  t.templateId
                )}
              </TableCell>
              <TableCell>
                {editing === t.templateId ? (
                  <Select value={editValues.channel ?? t.channel} onValueChange={(v: string) => setEditValues({ ...editValues, channel: v })}>
                    <SelectTrigger size="sm" className="w-36">
                      <SelectValue placeholder="Channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMAIL">EMAIL</SelectItem>
                      <SelectItem value="SMS">SMS</SelectItem>
                      <SelectItem value="PUSH_NOTIFICATION">PUSH_NOTIFICATION</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  t.channel
                )}
              </TableCell>
              <TableCell>
                {editing === t.templateId ? (
                  <Input value={editValues.subject ?? t.subject} onChange={(e: any) => setEditValues({ ...editValues, subject: e.target.value })} />
                ) : (
                  t.subject
                )}
              </TableCell>
              <TableCell>
                {editing === t.templateId ? (
                  <div className="flex flex-col gap-2">
                    <textarea value={editValues.body ?? t.body} onChange={(e) => setEditValues({ ...editValues, body: e.target.value })} className="p-2 border rounded" />
                    <div className="flex gap-2">
                      <Button variant="default" size="sm" onClick={() => handleSaveEdit(t.templateId)}>Save</Button>
                      <Button variant="ghost" size="sm" onClick={() => { setEditing(null); setEditValues({}); }}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="truncate">{t.body}</span>
                    <Button size="sm" onClick={() => { setEditing(t.templateId); setEditValues(t); }}>Edit</Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Add/Edit UI can be added here */}
    </div>
  );
}
