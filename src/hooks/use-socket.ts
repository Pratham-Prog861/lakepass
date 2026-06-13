"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function useSocket() {
  const [socketObj, setSocketObj] = useState<{
    on: (event: string, callback: (...args: any[]) => void) => void;
    off: (event: string, callback?: (...args: any[]) => void) => void;
  } | null>(null);

  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Supabase URL or Anon Key is missing. Realtime updates will not work.");
      return;
    }

    const listeners = new Map<string, Array<(...args: any[]) => void>>();

    // Subscribe to Supabase Realtime channel
    const channel = supabase.channel("realtime_bookings");

    channel
      .on("broadcast", { event: "booking:confirmed" }, (message) => {
        console.log("[Supabase Realtime] Received broadcast booking:confirmed event:", message.payload);
        const eventListeners = listeners.get("booking:confirmed");
        if (eventListeners) {
          eventListeners.forEach((cb) => cb(message.payload));
        }
      })
      .subscribe((status) => {
        console.log(`[Supabase Realtime] Subscription status: ${status}`);
      });

    setSocketObj({
      on: (event: string, callback: (...args: any[]) => void) => {
        const arr = listeners.get(event) || [];
        arr.push(callback);
        listeners.set(event, arr);
      },
      off: (event: string, callback?: (...args: any[]) => void) => {
        if (!callback) {
          listeners.delete(event);
        } else {
          const arr = listeners.get(event) || [];
          const idx = arr.indexOf(callback);
          if (idx !== -1) {
            arr.splice(idx, 1);
          }
          listeners.set(event, arr);
        }
      },
    });

    return () => {
      console.log("[Supabase Realtime] Cleaning up subscription...");
      supabase.removeChannel(channel);
    };
  }, []);

  return socketObj;
}

export default useSocket;
