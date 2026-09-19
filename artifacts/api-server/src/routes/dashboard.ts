import { Router, type IRouter } from "express";
import { and, eq, gte, lte } from "drizzle-orm";
import {
  db,
  invoicesTable,
  purchaseBillsTable,
  expensesTable,
  accountsTable,
} from "@workspace/db";
import { requireAuthentication } from "../middlewares/auth";
import { requireModule } from "../middlewares/moduleEntitlement";
import { writeAuditLog } from "../lib/audit";

const router: IRouter = Router();
router.use(requireAuthentication);
router.use("/organizations/:organizationId", requireModule("finance"));

const getOrgId = (req: any) => String(req.params.organizationId);

router.get(
  "/organizations/:organizationId/dashboard/analytics",
  async (req, res) => {
    try {
      const organizationId = getOrgId(req);
      const now = new Date();
      const currentYear = now.getFullYear();
      const yearStart = new Date(currentYear, 0, 1);

      // Fetch all invoices, bills, expenses for org
      const invoicesList = await db
        .select()
        .from(invoicesTable)
        .where(eq(invoicesTable.organizationId, organizationId));

      const billsList = await db
        .select()
        .from(purchaseBillsTable)
        .where(eq(purchaseBillsTable.organizationId, organizationId));

      const expensesList = await db
        .select()
        .from(expensesTable)
        .where(eq(expensesTable.organizationId, organizationId));

      // Calculate YTD totals
      let totalRevenueYtd = 0;
      let totalOutputVat = 0;
      let totalReceivables = 0;

      // AR Aging buckets
      let ar0_30 = 0, ar0_30_count = 0;
      let ar31_60 = 0, ar31_60_count = 0;
      let ar61_90 = 0, ar61_90_count = 0;
      let ar90_plus = 0, ar90_plus_count = 0;

      for (const inv of invoicesList) {
        if (inv.status !== 'CANCELLED') {
          const invTotal = Number(inv.totalAmount || 0);
          const invSubtotal = Number(inv.subtotal || 0);
          const invTax = Number(inv.taxAmount || 0);
          const invDate = new Date(inv.issueDate);

          if (invDate >= yearStart) {
            totalRevenueYtd += invSubtotal;
            totalOutputVat += invTax;
          }

          if (inv.status !== 'PAID') {
            totalReceivables += invTotal;
            const diffDays = Math.floor((now.getTime() - invDate.getTime()) / (1000 * 3600 * 24));
            if (diffDays <= 30) {
              ar0_30 += invTotal;
              ar0_30_count++;
            } else if (diffDays <= 60) {
              ar31_60 += invTotal;
              ar31_60_count++;
            } else if (diffDays <= 90) {
              ar61_90 += invTotal;
              ar61_90_count++;
            } else {
              ar90_plus += invTotal;
              ar90_plus_count++;
            }
          }
        }
      }

      let totalExpensesYtd = 0;
      let totalInputVat = 0;
      let totalPayables = 0;

      // AP Aging buckets
      let ap0_30 = 0, ap0_30_count = 0;
      let ap31_60 = 0, ap31_60_count = 0;
      let ap61_90 = 0, ap61_90_count = 0;
      let ap90_plus = 0, ap90_plus_count = 0;

      for (const b of billsList) {
        if (b.status !== 'CANCELLED') {
          const billTotal = Number(b.totalAmount || 0);
          const billSubtotal = Number(b.subtotal || 0);
          const billTax = Number(b.taxAmount || 0);
          const billDate = new Date(b.billDate);

          if (billDate >= yearStart) {
            totalExpensesYtd += billSubtotal;
            totalInputVat += billTax;
          }

          if (b.status !== 'PAID') {
            totalPayables += billTotal;
            const diffDays = Math.floor((now.getTime() - billDate.getTime()) / (1000 * 3600 * 24));
            if (diffDays <= 30) {
              ap0_30 += billTotal;
              ap0_30_count++;
            } else if (diffDays <= 60) {
              ap31_60 += billTotal;
              ap31_60_count++;
            } else if (diffDays <= 90) {
              ap61_90 += billTotal;
              ap61_90_count++;
            } else {
              ap90_plus += billTotal;
              ap90_plus_count++;
            }
          }
        }
      }

      for (const exp of expensesList) {
        const expTotal = Number(exp.subtotal || 0);
        const expTax = Number(exp.taxAmount || 0);
        const expDate = new Date(exp.expenseDate);

        if (expDate >= yearStart) {
          totalExpensesYtd += expTotal;
          totalInputVat += expTax;
        }
      }

      const netProfitYtd = totalRevenueYtd - totalExpensesYtd;
      const netMarginPercentage = totalRevenueYtd > 0 ? (netProfitYtd / totalRevenueYtd) * 100 : 0;
      const netVatLiability = totalOutputVat - totalInputVat;

      // AR Aging buckets formatting
      const arTotal = totalReceivables || 1;
      const arAging = [
        {
          range: "0-30",
          labelEn: "0 - 30 Days",
          labelAr: "٠ - ٣٠ يوم",
          amount: ar0_30.toFixed(2),
          percentage: Number(((ar0_30 / arTotal) * 100).toFixed(1)),
          count: ar0_30_count,
        },
        {
          range: "31-60",
          labelEn: "31 - 60 Days",
          labelAr: "٣١ - ٦٠ يوم",
          amount: ar31_60.toFixed(2),
          percentage: Number(((ar31_60 / arTotal) * 100).toFixed(1)),
          count: ar31_60_count,
        },
        {
          range: "61-90",
          labelEn: "61 - 90 Days",
          labelAr: "٦١ - ٩٠ يوم",
          amount: ar61_90.toFixed(2),
          percentage: Number(((ar61_90 / arTotal) * 100).toFixed(1)),
          count: ar61_90_count,
        },
        {
          range: "90+",
          labelEn: "90+ Days Overdue",
          labelAr: "أكثر من ٩٠ يوم",
          amount: ar90_plus.toFixed(2),
          percentage: Number(((ar90_plus / arTotal) * 100).toFixed(1)),
          count: ar90_plus_count,
        },
      ];

      // AP Aging buckets formatting
      const apTotal = totalPayables || 1;
      const apAging = [
        {
          range: "0-30",
          labelEn: "0 - 30 Days",
          labelAr: "٠ - ٣٠ يوم",
          amount: ap0_30.toFixed(2),
          percentage: Number(((ap0_30 / apTotal) * 100).toFixed(1)),
          count: ap0_30_count,
        },
        {
          range: "31-60",
          labelEn: "31 - 60 Days",
          labelAr: "٣١ - ٦٠ يوم",
          amount: ap31_60.toFixed(2),
          percentage: Number(((ap31_60 / apTotal) * 100).toFixed(1)),
          count: ap31_60_count,
        },
        {
          range: "61-90",
          labelEn: "61 - 90 Days",
          labelAr: "٦١ - ٩٠ يوم",
          amount: ap61_90.toFixed(2),
          percentage: Number(((ap61_90 / apTotal) * 100).toFixed(1)),
          count: ap61_90_count,
        },
        {
          range: "90+",
          labelEn: "90+ Days Overdue",
          labelAr: "أكثر من ٩٠ يوم",
          amount: ap90_plus.toFixed(2),
          percentage: Number(((ap90_plus / apTotal) * 100).toFixed(1)),
          count: ap90_plus_count,
        },
      ];

      // Build Past 6 Months Trend
      const monthNamesEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const monthNamesAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

      const monthlyTrends = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthIdx = d.getMonth();
        const year = d.getFullYear();
        const mStart = new Date(year, monthIdx, 1);
        const mEnd = new Date(year, monthIdx + 1, 0, 23, 59, 59);

        let mRev = 0;
        for (const inv of invoicesList) {
          if (inv.status !== 'CANCELLED') {
            const dt = new Date(inv.issueDate);
            if (dt >= mStart && dt <= mEnd) {
              mRev += Number(inv.subtotal || 0);
            }
          }
        }

        let mExp = 0;
        for (const b of billsList) {
          if (b.status !== 'CANCELLED') {
            const dt = new Date(b.billDate);
            if (dt >= mStart && dt <= mEnd) {
              mExp += Number(b.subtotal || 0);
            }
          }
        }
        for (const exp of expensesList) {
          const dt = new Date(exp.expenseDate);
          if (dt >= mStart && dt <= mEnd) {
            mExp += Number(exp.subtotal || 0);
          }
        }

        monthlyTrends.push({
          monthKey: `${year}-${String(monthIdx + 1).padStart(2, '0')}`,
          monthNameEn: monthNamesEn[monthIdx],
          monthNameAr: monthNamesAr[monthIdx],
          revenue: mRev.toFixed(2),
          expenses: mExp.toFixed(2),
          netProfit: (mRev - mExp).toFixed(2),
        });
      }

      writeAuditLog({
        req,
        action: "dashboard.analytics_viewed",
        entityType: "dashboard",
        organizationId,
      });

      return res.json({
        currency: "SAR",
        totalRevenueYtd: totalRevenueYtd.toFixed(2),
        totalExpensesYtd: totalExpensesYtd.toFixed(2),
        netProfitYtd: netProfitYtd.toFixed(2),
        netMarginPercentage: Number(netMarginPercentage.toFixed(1)),
        totalReceivables: totalReceivables.toFixed(2),
        totalPayables: totalPayables.toFixed(2),
        netVatLiability: netVatLiability.toFixed(2),
        arAging,
        apAging,
        monthlyTrends,
      });
    } catch (err: any) {
      console.error("[Dashboard API] Error fetching analytics:", err);
      return res.status(500).json({ error: "Failed to fetch dashboard analytics", message: err.message });
    }
  }
);

export default router;
