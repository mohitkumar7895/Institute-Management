import { connectDB } from "@/lib/mongodb";
import { AtcUser } from "@/models/AtcUser";
import { AtcApplication } from "@/models/AtcApplication";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const apps = await AtcApplication.find({ status: "approved", tpCode: { $exists: true, $ne: "" } }).lean();
    const orphanedApps = [];
    
    for (const app of apps) {
      const user = await AtcUser.findOne({ tpCode: app.tpCode });
      const userByAppId = await AtcUser.findOne({ applicationId: app._id });
      
      if (!user && !userByAppId) {
        orphanedApps.push({
          id: app._id,
          tpCode: app.tpCode,
          name: app.trainingPartnerName,
          email: app.email,
          reason: "No user found by tpCode or appId"
        });
      } else if (!user && userByAppId) {
        orphanedApps.push({
          id: app._id,
          tpCode: app.tpCode,
          name: app.trainingPartnerName,
          email: app.email,
          reason: `Found user by appId but NOT by tpCode! User has tpCode: ${userByAppId.tpCode}`
        });
      }
    }

    const usersWithMismatchedApps = [];
    const allUsers = await AtcUser.find().lean();
    for (const u of allUsers) {
       const app = await AtcApplication.findOne({ tpCode: u.tpCode });
       if (!app) {
         usersWithMismatchedApps.push({
           id: u._id,
           tpCode: u.tpCode,
           email: u.email,
           reason: "No application found for this user's tpCode"
         });
       }
    }
    
    return NextResponse.json({ orphanedApps, usersWithMismatchedApps, totalApps: apps.length, totalUsers: allUsers.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
