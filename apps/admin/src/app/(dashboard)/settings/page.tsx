"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Skeleton, toast } from "@mirakart/ui";
import { PageHeader } from "../../../components/page-header";
import { listSettings, bulkUpdateSettings, type Setting } from "../../../lib/api/settings";

export default function SettingsPage() {
  const qc = useQueryClient();
  const [values, setValues] = React.useState<Record<string, string>>({});

  const { data: settings, isLoading } = useQuery({ queryKey: ["settings"], queryFn: listSettings });

  React.useEffect(() => {
    if (settings) {
      const map: Record<string, string> = {};
      settings.forEach((s) => { map[s.key] = s.value; });
      setValues(map);
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: () => bulkUpdateSettings(values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); toast({ title: "Settings saved", variant: "success" }); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "danger" }),
  });

  function groupSettings(settings: Setting[]) {
    const groups: Record<string, Setting[]> = {};
    settings.forEach((s) => {
      const [group] = s.key.split(".");
      const groupKey = group ?? "general";
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(s);
    });
    return Object.entries(groups);
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <PageHeader title="Settings" crumbs={[{ label: "Dashboard", href: "/" }, { label: "Settings" }]} />

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <>
          {settings && groupSettings(settings).map(([group, items]) => (
            <div key={group} className="rounded-xl border border-border bg-white p-6">
              <h2 className="mb-4 text-sm font-semibold capitalize">{group.replace("_", " ")}</h2>
              <div className="flex flex-col gap-4">
                {items.map((s) => (
                  <div key={s.key}>
                    <label className="mb-1 block text-sm font-medium capitalize">{s.key.split(".").slice(1).join(" ").replace("_", " ")}</label>
                    {s.description && <p className="mb-1 text-xs text-muted-foreground">{s.description}</p>}
                    {s.type === "BOOLEAN" ? (
                      <select
                        className="h-[42px] w-full rounded border border-border px-3 text-sm"
                        value={values[s.key] ?? s.value}
                        onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}
                      >
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    ) : (
                      <Input
                        value={values[s.key] ?? s.value}
                        onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div>
            <Button onClick={() => mutation.mutate()} isLoading={mutation.isPending}>Save All Settings</Button>
          </div>
        </>
      )}
    </div>
  );
}
