import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
          Marina Settings
        </h1>
        <p className="text-sm text-zinc-500">Configure your profile, billing, and marina information.</p>
      </div>

      <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <Settings className="h-5 w-5 text-primary" />
          <h3 className="font-heading text-sm font-bold text-zinc-800 dark:text-zinc-200">General Settings</h3>
        </div>
        <div className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">Marina Name</label>
            <input
              type="text"
              placeholder="e.g. Sunset Harbor Marina"
              className="max-w-md rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">Description</label>
            <textarea
              placeholder="e.g. The premier boat rental and launching service on Lake Travis."
              className="max-w-md rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
              rows={3}
            />
          </div>
          <button className="w-max rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-xs">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
