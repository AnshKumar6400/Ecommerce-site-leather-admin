"use client";

import * as React from "react";

import { adminFetch } from "@/lib/adminApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState, Notice, PageHeader } from "@/components/admin/PageHeader";
import { ImageField } from "@/components/admin/ImageField";
import { useAdminResource } from "@/components/admin/useAdminResource";

type Settings = {
  accentColor: string;
  announcementText: string;
  tagline: string;
  supportPhone: string;
  supportEmail: string;
  whatsappUrl: string;
  heroImageUrl: string | null;
  heroImageMobileUrl: string | null;
};

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function SettingsView() {
  const settings = useAdminResource<Settings>("/api/admin/settings");
  const [draft, setDraft] = React.useState<Settings | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [failure, setFailure] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (settings.data) setDraft(settings.data);
  }, [settings.data]);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => setDraft((current) => (current ? { ...current, [key]: value } : current));
  const dirty = Boolean(draft && settings.data && JSON.stringify(draft) !== JSON.stringify(settings.data));
  const valid = !draft || HEX.test(draft.accentColor);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setSaving(true);
    setFailure(null);
    try {
      await adminFetch("/api/admin/settings", { method: "PATCH", body: JSON.stringify(draft) });
      setNotice("Settings saved. The storefront picks them up within a minute.");
      await settings.reload();
    } catch (cause) {
      setFailure(cause instanceof Error ? cause.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Configuration" title="Settings" description="Storefront copy, contact details and homepage imagery — no deploy needed." />
      {notice && <Notice message={notice} onDismiss={() => setNotice(null)} />}
      {(settings.error || failure) && <ErrorState message={(settings.error ?? failure)!} />}
      {draft && (
        <form onSubmit={save} className="grid max-w-3xl gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Announcement &amp; tagline</CardTitle>
              <CardDescription>The scrolling strip under the header, and the line beside the logo.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="announcement">Announcement</Label>
                <Input id="announcement" value={draft.announcementText} onChange={(event) => set("announcementText", event.target.value)} maxLength={200} />
                <p className="text-xs text-muted-foreground">Leave blank to hide the strip.</p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="tagline">Tagline</Label>
                <Input id="tagline" value={draft.tagline} onChange={(event) => set("tagline", event.target.value)} maxLength={80} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="accent">Accent colour</Label>
                <div className="flex items-center gap-2">
                  <input type="color" aria-label="Pick accent colour" value={HEX.test(draft.accentColor) && draft.accentColor.length === 7 ? draft.accentColor : "#ffffff"} onChange={(event) => set("accentColor", event.target.value.toUpperCase())} className="size-9 cursor-pointer rounded border border-input bg-transparent p-0.5" />
                  <Input id="accent" value={draft.accentColor} onChange={(event) => set("accentColor", event.target.value)} className="w-32 font-mono" />
                </div>
                {!valid && <p className="text-xs text-destructive">Enter a hex colour, like #FFFFFF.</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
              <CardDescription>Shown in the storefront footer and the chat panel.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={draft.supportPhone} onChange={(event) => set("supportPhone", event.target.value)} placeholder="+91 …" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="email">Support email</Label>
                <Input id="email" type="email" value={draft.supportEmail} onChange={(event) => set("supportEmail", event.target.value)} placeholder="support@…" />
              </div>
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="whatsapp">WhatsApp / community link</Label>
                <Input id="whatsapp" value={draft.whatsappUrl} onChange={(event) => set("whatsappUrl", event.target.value)} placeholder="https://whatsapp.com/channel/…" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Homepage hero</CardTitle>
              <CardDescription>The full-width image at the top of the homepage. Leave empty to use the built-in artwork.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <ImageField id="hero-image" label="Desktop image" value={draft.heroImageUrl ?? ""} onChange={(url) => set("heroImageUrl", url || null)} />
              <ImageField id="hero-image-mobile" label="Mobile image" value={draft.heroImageMobileUrl ?? ""} onChange={(url) => set("heroImageMobileUrl", url || null)} hint="Optional — falls back to the desktop image." />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={!dirty || !valid || saving}>{saving ? "Saving…" : "Save settings"}</Button>
          </div>
        </form>
      )}
    </>
  );
}
