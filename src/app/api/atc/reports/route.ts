import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AtcStudent } from "@/models/Student";
import { FeeTransaction } from "@/models/FeeTransaction";
import { getAuthUser } from "@/utils/auth";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user || user.role !== "atc") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "all-time"; // today, weekly, monthly, all-time

  try {
    // Determine date range
    const now = new Date();
    let startDate = new Date();
    
    if (period === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "weekly") {
      startDate.setDate(now.getDate() - 7);
    } else if (period === "monthly") {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === "yearly") {
      startDate.setFullYear(now.getFullYear() - 1);
    } else if (period === "all-time") {
      startDate = new Date(0); // Beginning of time
    }

    // 1. Fetch Students created in period
    const studentsQuery: any = { 
      tpCode: user.tpCode 
    };
    const allStudents = await AtcStudent.find(studentsQuery).select("createdAt status totalFee admissionFees duesAmount course").lean();
    
    let admissionCount = 0;
    let pendingAdmissions = 0;
    let approvedAdmissions = 0;
    
    let totalExpectedFee = 0;
    let totalDuesOverall = 0;

    allStudents.forEach(s => {
      // period filtering
      const createdDate = s.createdAt ? new Date(s.createdAt) : new Date(0);
      if (createdDate >= startDate) {
        admissionCount++;
        if (s.status === "pending" || s.status === "pending_admin" || s.status === "pending_atc") pendingAdmissions++;
        if (s.status === "approved" || s.status === "active") approvedAdmissions++;
      }
      // global fee stats for this ATC
      const total = s.totalFee || Number(s.admissionFees) || 0;
      totalExpectedFee += total;
    });

    // 2. Fetch Fee Transactions for this ATC
    // Transactions do not have tpCode directly, they link to studentId.
    const studentIds = allStudents.map(s => s._id);
    
    // Transactions matching this period
    const periodTransactions = await FeeTransaction.find({
      studentId: { $in: studentIds },
      date: { $gte: startDate }
    }).lean();

    let collectedInPeriod = 0;
    periodTransactions.forEach(t => {
      if (t.type === "collect") collectedInPeriod += t.amount;
      else if (t.type === "return") collectedInPeriod -= t.amount;
    });

    // All transactions to compute real dues
    const allTransactions = await FeeTransaction.find({
      studentId: { $in: studentIds }
    }).lean();

    let totalCollectedOverall = 0;
    let upcomingAmount = 0;
    
    allTransactions.forEach(t => {
      if (t.type === "collect") totalCollectedOverall += t.amount;
      else if (t.type === "return") totalCollectedOverall -= t.amount;

      // Find upcoming expected installments (just crude check for nextInstallmentDate in future)
      if (t.type === "collect" && t.nextInstallmentDate && t.nextInstallmentAmount) {
        const nextDate = new Date(t.nextInstallmentDate);
        if (nextDate >= new Date(new Date().setHours(0,0,0,0))) {
          upcomingAmount += Number(t.nextInstallmentAmount);
        }
      }
    });

    totalDuesOverall = totalExpectedFee - totalCollectedOverall;

    // Build chart data - e.g. for last 7 days or months
    let chartData = [];
    if (period === "weekly" || period === "today") {
      // Daily breakdown for last 7 days (or today)
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
        
        const dayStudents = allStudents.filter(s => new Date(s.createdAt).toDateString() === d.toDateString());
        const dayTxs = allTransactions.filter(t => new Date(t.date).toDateString() === d.toDateString() && t.type === 'collect');
        
        const dayRevenue = dayTxs.reduce((sum, t) => sum + t.amount, 0);
        
        chartData.push({
          label: dateStr,
          admissions: dayStudents.length,
          revenue: dayRevenue
        });
      }
    } else {
      // For all-time/yearly/monthly breakdown for last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = d.toLocaleDateString("en-IN", { month: "short" });
        
        const monthStudents = allStudents.filter(s => new Date(s.createdAt).getMonth() === d.getMonth() && new Date(s.createdAt).getFullYear() === d.getFullYear());
        const monthTxs = allTransactions.filter(t => new Date(t.date).getMonth() === d.getMonth() && new Date(t.date).getFullYear() === d.getFullYear() && t.type === 'collect');
        
        const monthRevenue = monthTxs.reduce((sum, t) => sum + t.amount, 0);
        
        chartData.push({
          label: monthStr,
          admissions: monthStudents.length,
          revenue: monthRevenue
        });
      }
    }

    // Course Distribution
    const courseMap = new Map<string, number>();
    allStudents.forEach(s => {
      const courseName = s.course || "Unknown";
      courseMap.set(courseName, (courseMap.get(courseName) || 0) + 1);
    });

    const courseDistribution = Array.from(courseMap.entries())
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 courses

    return NextResponse.json({
      period,
      admissions: {
        total: admissionCount,
        pending: pendingAdmissions,
        approved: approvedAdmissions
      },
      fees: {
        collectedInPeriod,
        totalCollectedOverall,
        totalDuesOverall,
        totalExpectedFee,
        upcomingAmount
      },
      chartData,
      courseDistribution
    });

  } catch (error: any) {
    console.error("[api/atc/reports]", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
