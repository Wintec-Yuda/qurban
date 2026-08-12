import { requireRole } from "@/lib/actions/auth-actions";
import { getFullDistribution } from "@/lib/distribution";
import { DashboardHeader } from "@/components/dashboard-header";
import { SekretarisDashboard } from "@/components/sekretaris/sekretaris-dashboard";

export default async function SekretarisPage() {
  await requireRole("SEKRETARIS");
  const { pengaturan, groups, panitia, result } = await getFullDistribution();

  return (
    <div className="min-h-screen bg-zinc-50">
      <DashboardHeader
        title="Dashboard Sekretaris"
        subtitle="Kelola panitia, total daging, dan persentase pembagian"
      />
      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <SekretarisDashboard
          totalKg={pengaturan.totalKg}
          panitia={panitia}
          groups={groups}
          result={result}
        />
      </main>
    </div>
  );
}
