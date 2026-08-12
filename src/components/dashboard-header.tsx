import { LogoutButton } from "@/components/logout-button";

export function DashboardHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-4">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <LogoutButton />
    </header>
  );
}
