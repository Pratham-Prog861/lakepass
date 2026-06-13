"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, UploadCloud } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const editBoatSchema = z.object({
  name: z.string().min(1, "Boat name is required").max(100),
  description: z.string().optional(),
  type: z.string().min(1, "Please select a boat type"),
  capacity: z.coerce
    .number()
    .int()
    .min(1, "Capacity must be at least 1 guest"),
  pricePerHour: z.coerce
    .number()
    .min(1, "Price must be at least $1"),

  imageUrl: z
    .string()
    .url("Please enter a valid image URL")
    .or(z.string().length(0))
    .optional(),
});

type FormValues = z.infer<typeof editBoatSchema>;

interface Boat {
  id: string;
  name: string;
  description: string | null;
  type: string;
  capacity: number;
  pricePerHour: number; // in cents
  imageUrl: string | null;
  marinaId: string;
}

export default function EditBoatPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  // Fetch boat details
  const { data: boatData, isLoading, isError } = useQuery<{ boat: Boat }>({
    queryKey: ["boat", id],
    queryFn: async () => {
      const res = await fetch(`/api/boats/${id}`);
      if (!res.ok) throw new Error("Failed to fetch boat details");
      return res.json();
    },
  });

  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(editBoatSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "speedboat",
      capacity: 6,
      pricePerHour: 75,
      imageUrl: "",
    },
  });

  const imageUrl = watch("imageUrl");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload?bucket=boat-images", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to upload image");
      }

      const data = await res.json();
      setValue("imageUrl", data.url, { shouldValidate: true });
      toast.success("Image uploaded successfully to Supabase!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  // Populate values when boat data is loaded
  useEffect(() => {
    if (boatData?.boat) {
      setValue("name", boatData.boat.name);
      setValue("description", boatData.boat.description || "");
      setValue("type", boatData.boat.type);
      setValue("capacity", boatData.boat.capacity);
      setValue("pricePerHour", boatData.boat.pricePerHour / 100); // convert cents to dollars
      setValue("imageUrl", boatData.boat.imageUrl || "");
    }
  }, [boatData, setValue]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      // Convert dollars to cents for database storage
      const payload = {
        ...values,
        pricePerHour: Math.round(values.pricePerHour * 100),
      };

      const res = await fetch(`/api/boats/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update boat");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boats"] });
      queryClient.invalidateQueries({ queryKey: ["boat", id] });
      toast.success("Boat updated successfully!");
      router.push("/dashboard/boats");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update boat.");
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (isError || !boatData?.boat) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50/10 p-6 text-center text-xs font-semibold text-red-600 dark:border-red-950/20 dark:bg-red-950/10">
        Failed to load boat details or boat not found.
      </div>
    );
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/boats"
          className="rounded-xl border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-55 hover:text-zinc-700 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex flex-col gap-0.5">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Edit Boat
          </h1>
          <p className="text-xs text-zinc-500">Update details for this rental boat.</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
      >
        {/* Name & Type */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
              Boat Name
            </label>
            <input
              type="text"
              {...register("name")}
              placeholder="e.g. Tahoe Sport Pontoon"
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
            />
            {errors.name && (
              <span className="text-[10px] text-red-500 font-bold">{errors.name.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
              Boat Type
            </label>
            <select
              {...register("type")}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-250"
            >
              <option value="pontoon">Pontoon</option>
              <option value="speedboat">Speedboat</option>
              <option value="yacht">Yacht</option>
              <option value="jetski">Jet Ski</option>
            </select>
            {errors.type && (
              <span className="text-[10px] text-red-500 font-bold">{errors.type.message}</span>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
            Description
          </label>
          <textarea
            {...register("description")}
            placeholder="Provide information on amenities, engines, bimini tops, or rental guidelines."
            className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
            rows={3}
          />
        </div>

        {/* Capacity & Price */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
              Max Capacity (Guests)
            </label>
            <input
              type="number"
              {...register("capacity", { valueAsNumber: true })}
              placeholder="e.g. 8"
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
            />
            {errors.capacity && (
              <span className="text-[10px] text-red-500 font-bold">{errors.capacity.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
              Price Per Hour ($ USD)
            </label>
            <input
              type="number"
              {...register("pricePerHour", { valueAsNumber: true })}
              placeholder="e.g. 85"
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-xs font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
            />
            {errors.pricePerHour && (
              <span className="text-[10px] text-red-500 font-bold">{errors.pricePerHour.message}</span>
            )}
          </div>
        </div>

        {/* Boat Image Uploader & Preview */}
        <div className="flex flex-col gap-2.5">
          <label className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
            Boat Image
          </label>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Image Preview Window */}
            <div className="relative flex h-32 w-48 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 shadow-xs">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="Uploaded preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-1.5 text-center p-3">
                  <UploadCloud className="h-5 w-5 text-zinc-400" />
                  <span className="text-[9px] text-zinc-400 leading-tight">No image uploaded</span>
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
            </div>

            {/* Upload Input & Fallback */}
            <div className="flex flex-col gap-2.5 w-full">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading}
                className="block w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary file:cursor-pointer hover:file:bg-primary/20 dark:file:bg-primary/20 dark:file:text-primary-foreground disabled:opacity-60"
              />
              
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-zinc-450">Or enter URL manually:</span>
                <input
                  type="text"
                  {...register("imageUrl")}
                  placeholder="e.g. https://images.unsplash.com/photo-..."
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-semibold focus:outline-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                />
              </div>
            </div>
          </div>
          {errors.imageUrl && (
            <span className="text-[10px] text-red-500 font-bold">{errors.imageUrl.message}</span>
          )}
        </div>

        {/* Form Actions */}
        <div className="mt-4 flex items-center justify-end gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-850">
          <Link
            href="/dashboard/boats"
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
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
