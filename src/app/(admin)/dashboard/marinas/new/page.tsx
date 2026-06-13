"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const createMarinaSchema = z.object({
  name: z.string().min(1, "Marina name is required").max(100),
  description: z.string().optional(),
  latitude: z.coerce
    .number()
    .min(-90, "Latitude must be at least -90")
    .max(90, "Latitude cannot exceed 90"),
  longitude: z.coerce
    .number()
    .min(-180, "Longitude must be at least -180")
    .max(180, "Longitude cannot exceed 180"),

});

type FormValues = z.infer<typeof createMarinaSchema>;

export default function NewMarinaPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createMarinaSchema),
    defaultValues: {
      name: "",
      description: "",
      latitude: 30.2672, // Default coordinates (Austin, TX)
      longitude: -97.7431,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const res = await fetch("/api/marinas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create marina");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marinas"] });
      toast.success("Marina created successfully!");
      router.push("/dashboard/marinas");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create marina.");
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/marinas"
          className="rounded-xl border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-55 hover:text-zinc-700 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex flex-col gap-0.5">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Create Marina
          </h1>
          <p className="text-xs text-zinc-500">Register a new boat launch or storage location.</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
            Marina Name
          </label>
          <input
            type="text"
            {...register("name")}
            placeholder="e.g. Sunset Harbor Marina"
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
          />
          {errors.name && <span className="text-[10px] text-red-500 font-bold">{errors.name.message}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
            Description
          </label>
          <textarea
            {...register("description")}
            placeholder="Describe the marina services, slips, or boat launch information."
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              {...register("latitude", { valueAsNumber: true })}
              placeholder="e.g. 30.2672"
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
            />
            {errors.latitude && (
              <span className="text-[10px] text-red-500 font-bold">{errors.latitude.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              {...register("longitude", { valueAsNumber: true })}
              placeholder="e.g. -97.7431"
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
            />
            {errors.longitude && (
              <span className="text-[10px] text-red-500 font-bold">{errors.longitude.message}</span>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-850">
          <Link
            href="/dashboard/marinas"
            className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-primary/95"
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Marina
          </button>
        </div>
      </form>
    </div>
  );
}
