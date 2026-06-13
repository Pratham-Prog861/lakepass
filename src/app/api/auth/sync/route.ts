import { NextResponse } from "next/server";
import { checkAndSyncUser } from "@/lib/auth-sync";

export async function GET() {
  try {
    const user = await checkAndSyncUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized or failed to sync user" },
        { status: 401 }
      );
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error in sync route handler:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
export const dynamic = "force-dynamic";
