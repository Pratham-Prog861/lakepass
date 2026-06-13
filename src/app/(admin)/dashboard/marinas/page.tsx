"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Compass, Plus, Edit, Trash2, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Marina {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
}

export default function MarinasListPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<{ marinas: Marina[] }>({
    queryKey: ["marinas"],
    queryFn: async () => {
      const res = await fetch("/api/marinas");
      if (!res.ok) throw new Error("Failed to fetch marinas");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/marinas/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete marina");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marinas"] });
      toast.success("Marina deleted successfully!");
    },
    onError: (err) => {
      toast.error("Failed to delete marina.");
      console.error(err);
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}? All associated boats will be deleted.`)) {
      deleteMutation.mutate(id);
    }
  };

  const marinasList = data?.marinas || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Marinas
          </h1>
          <p className="text-sm text-zinc-500">Manage your marina locations and details.</p>
        </div>
        <Link
          href="/dashboard/marinas/new"
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Marina
        </Link>
      </div>

      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50/10 p-6 text-center text-xs font-semibold text-red-600 dark:border-red-950/20 dark:bg-red-950/10">
          Failed to load marinas. Please try again.
        </div>
      ) : marinasList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 text-zinc-400 dark:bg-zinc-800">
            <Compass className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-zinc-800 dark:text-zinc-200">No marinas added yet</h3>
          <p className="mt-1.5 max-w-sm text-xs leading-normal text-zinc-400">
            Create your first marina profile to start adding boats and receiving consumer bookings.
          </p>
          <Link
            href="/dashboard/marinas/new"
            className="mt-5 rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Create Your First Marina
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {marinasList.map((marina) => (
            <div
              key={marina.id}
              className="flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Compass className="h-5 w-5 text-primary" />
                  <h3 className="font-heading font-bold text-zinc-900 dark:text-white">
                    {marina.name}
                  </h3>
                </div>
                <p className="text-xs text-zinc-500 line-clamp-3 min-h-[48px]">
                  {marina.description || "No description provided."}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                  <span>
                    Lat: {marina.latitude.toFixed(4)}, Long: {marina.longitude.toFixed(4)}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-zinc-50 pt-4 dark:border-zinc-850">
                <Link
                  href={`/dashboard/marinas/${marina.id}/edit`}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  <Edit className="h-4.5 w-4.5" />
                </Link>
                <button
                  onClick={() => handleDelete(marina.id, marina.name)}
                  disabled={deleteMutation.isPending}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export const dynamic = "force-dynamic";
