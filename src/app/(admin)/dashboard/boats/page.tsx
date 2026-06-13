"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { Anchor, Plus, Edit, Trash2, Search, Filter, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

interface Boat {
  id: string;
  name: string;
  description: string | null;
  type: string;
  capacity: number;
  pricePerHour: number; // in cents
  imageUrl: string | null;
  marinaId: string;
  marina: {
    name: string;
  };
}

interface Marina {
  id: string;
  name: string;
}

export default function BoatsListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [selectedMarinaId, setSelectedMarinaId] = useState("all");

  // Fetch marinas for filtering
  const { data: marinasData } = useQuery<{ marinas: Marina[] }>({
    queryKey: ["marinas"],
    queryFn: async () => {
      const res = await fetch("/api/marinas");
      if (!res.ok) throw new Error("Failed to fetch marinas");
      return res.json();
    },
  });

  // Fetch boats with queries
  const { data: boatsData, isLoading, isError } = useQuery<{ boats: Boat[] }>({
    queryKey: ["boats", search, type, selectedMarinaId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (type && type !== "all") params.append("type", type);
      if (selectedMarinaId && selectedMarinaId !== "all") params.append("marinaId", selectedMarinaId);

      const res = await fetch(`/api/boats?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch boats");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/boats/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete boat");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boats"] });
      toast.success("Boat deleted successfully!");
    },
    onError: (err) => {
      toast.error("Failed to delete boat.");
      console.error(err);
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const boatsList = boatsData?.boats || [];
  const marinasList = marinasData?.marinas || [];

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Boats Management
          </h1>
          <p className="text-sm text-zinc-500">Manage your rental fleet details and pricing.</p>
        </div>
        <Link
          href="/dashboard/boats/new"
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Boat
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex flex-1 items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search boats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-4 text-xs font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          />
        </div>

        {/* Marina Filter */}
        <div className="relative flex items-center">
          <select
            value={selectedMarinaId}
            onChange={(e) => setSelectedMarinaId(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
          >
            <option value="all">All Marinas</option>
            {marinasList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="relative flex items-center">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-bold text-zinc-600 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
          >
            <option value="all">All Types</option>
            <option value="pontoon">Pontoons</option>
            <option value="speedboat">Speedboats</option>
            <option value="yacht">Yachts</option>
            <option value="jetski">Jet Skis</option>
          </select>
        </div>
      </div>

      {/* Boats Content Grid */}
      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-100 bg-red-50/10 p-6 text-center text-xs font-semibold text-red-600 dark:border-red-950/20 dark:bg-red-950/10">
          Failed to load boats. Please try again.
        </div>
      ) : boatsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 text-zinc-400 dark:bg-zinc-800">
            <Anchor className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-zinc-800 dark:text-zinc-200">No boats added yet</h3>
          <p className="mt-1.5 max-w-sm text-xs leading-normal text-zinc-400">
            Create a boat profile linked to one of your marinas to make it available for booking.
          </p>
          <Link
            href="/dashboard/boats/new"
            className="mt-5 rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Add Your First Boat
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/50 text-[10px] font-bold tracking-wider text-zinc-400 uppercase dark:border-zinc-800 dark:bg-zinc-900/50">
                  <th className="px-6 py-4">Boat Name</th>
                  <th className="px-6 py-4">Marina</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Capacity</th>
                  <th className="px-6 py-4">Price/Hour</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {boatsList.map((boat) => (
                  <tr
                    key={boat.id}
                    className="text-xs text-zinc-700 transition-colors hover:bg-zinc-50/50 dark:text-zinc-300 dark:hover:bg-zinc-800/30"
                  >
                    <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">
                      {boat.name}
                    </td>
                    <td className="px-6 py-4 text-zinc-500">{boat.marina?.name}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-lg bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold capitalize dark:bg-zinc-800 dark:text-zinc-400">
                        {boat.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-zinc-400" />
                        <span>{boat.capacity} guests</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-white">
                      ${(boat.pricePerHour / 100).toFixed(2)}/hr
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/dashboard/boats/${boat.id}/edit`}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(boat.id, boat.name)}
                          disabled={deleteMutation.isPending}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
export const dynamic = "force-dynamic";
