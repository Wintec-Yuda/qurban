import { requireRole } from "@/lib/actions/auth-actions";
import { getFullDistribution } from "@/lib/distribution";
import { listAccounts } from "@/lib/actions/group-actions";
import { listHistory } from "@/lib/actions/pengaturan-actions";
import { DashboardHeader } from "@/components/dashboard-header";
import { KetuaDashboard } from "@/components/ketua/ketua-dashboard";

export default async function KetuaPage() {
  await requireRole("KETUA");
  const [{ pengaturan, groups, result }, accounts, history] = await Promise.all([
    getFullDistribution(),
    listAccounts(),
    listHistory(),
  ]);

  return (
    <div className="min-h-screen bg-zinc-50">
      <DashboardHeader
        title="Dashboard Ketua"
        subtitle="Pantau seluruh data pembagian daging kurban"
      />
      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <KetuaDashboard
          totalKg={pengaturan.totalKg}
          groups={groups}
          result={result}
          accounts={accounts}
          history={history}
        />
      </main>
    </div>
  );
}
