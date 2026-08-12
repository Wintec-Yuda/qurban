"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Group, Peserta, User, HistoryEntry } from "@prisma/client";
import type { DistributionResult } from "@/lib/calc";
import { setGroupActive, deleteAccount } from "@/lib/actions/group-actions";
import { createAccount } from "@/lib/actions/auth-actions";
import { finishEvent } from "@/lib/actions/pengaturan-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

type GroupWithRelations = Group & { peserta: Peserta[]; leader: User | null };
type AccountWithGroup = User & { group: Group | null };

function fmtKg(n: number) {
  return n.toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

export function KetuaDashboard({
  totalKg,
  groups,
  result,
  accounts,
  history,
}: {
  totalKg: number;
  groups: GroupWithRelations[];
  result: {
    totalBobot: number;
    nilaiPer1Persen: number;
    panitiaResult: DistributionResult[];
    pesertaResult: DistributionResult[];
  };
  accounts: AccountWithGroup[];
  history: HistoryEntry[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const totalPenerima = result.panitiaResult.length + result.pesertaResult.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Daging</CardDescription>
            <CardTitle className="text-2xl">{fmtKg(totalKg)} kg</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Penerima</CardDescription>
            <CardTitle className="text-2xl">{totalPenerima}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Kg per 1% Bobot</CardDescription>
            <CardTitle className="text-2xl">{fmtKg(result.nilaiPer1Persen)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <FinishEventCard />

      <Tabs defaultValue="hasil" className="space-y-6">
        <TabsList>
          <TabsTrigger value="hasil">Hasil & Group</TabsTrigger>
          <TabsTrigger value="akun">Akun</TabsTrigger>
          <TabsTrigger value="riwayat">Riwayat</TabsTrigger>
        </TabsList>

        <TabsContent value="hasil" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hasil Pembagian</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="w-24">Persentase</TableHead>
                    <TableHead className="w-28 text-right">Kg</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.panitiaResult.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell><Badge variant="outline">Panitia</Badge></TableCell>
                      <TableCell>{p.percentage}%</TableCell>
                      <TableCell className="text-right">{fmtKg(p.kg)} kg</TableCell>
                    </TableRow>
                  ))}
                  {result.pesertaResult.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell><Badge variant="outline">Peserta</Badge></TableCell>
                      <TableCell>{p.percentage}%</TableCell>
                      <TableCell className="text-right">{fmtKg(p.kg)} kg</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Group</CardTitle>
              <CardDescription>
                Nonaktifkan group untuk mengeluarkan pesertanya dari perhitungan.
                Status nonaktif tidak otomatis kembali saat reset.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Group</TableHead>
                    <TableHead>Ketua Group</TableHead>
                    <TableHead className="w-20">Peserta</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell>{g.name}</TableCell>
                      <TableCell>{g.leader?.username ?? "-"}</TableCell>
                      <TableCell>{g.peserta.length}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={g.isActive}
                            onCheckedChange={(checked) =>
                              startTransition(async () => {
                                await setGroupActive(g.id, checked === true);
                                router.refresh();
                              })
                            }
                          />
                          <span className="text-sm">
                            {g.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {groups.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Belum ada group.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="akun" className="space-y-6">
          <CreateAccountCard />
          <Card>
            <CardHeader>
              <CardTitle>Akun Sekretaris & Ketua Group</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>{a.username}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {a.role === "SEKRETARIS" ? "Sekretaris" : "Ketua Group"}
                        </Badge>
                      </TableCell>
                      <TableCell>{a.group?.name ?? "-"}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() =>
                            startTransition(async () => {
                              await deleteAccount(a.id);
                              router.refresh();
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {accounts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        Belum ada akun.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="riwayat">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Acara</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {history.map((h) => (
                  <li key={h.id} className="text-sm">
                    {h.summary}
                  </li>
                ))}
                {history.length === 0 && (
                  <p className="text-sm text-muted-foreground">Belum ada riwayat.</p>
                )}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CreateAccountCard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState<"SEKRETARIS" | "KETUA_GROUP">("SEKRETARIS");
  const [error, setError] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftarkan Akun Baru</CardTitle>
        <CardDescription>
          Buat akun Sekretaris atau Ketua Group. Ketua Group otomatis mendapat
          Group baru sesuai nama yang diisi.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const formData = new FormData(form);
            formData.set("role", role);
            setError(null);
            startTransition(async () => {
              const res = await createAccount(undefined, formData);
              if (res?.error) {
                setError(res.error);
              } else {
                form.reset();
                router.refresh();
              }
            });
          }}
        >
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SEKRETARIS">Sekretaris</SelectItem>
                <SelectItem value="KETUA_GROUP">Ketua Group</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {role === "KETUA_GROUP" && (
            <div className="space-y-2">
              <Label htmlFor="groupName">Nama Group</Label>
              <Input id="groupName" name="groupName" required />
            </div>
          )}
          <div className="sm:col-span-2">
            {error && <p className="mb-2 text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={isPending}>
              {isPending ? "Memproses..." : "Daftarkan"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function FinishEventCard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle>Selesaikan Acara</CardTitle>
        <CardDescription>
          Total kg, semua persentase, dan status &quot;sudah menerima&quot; akan
          direset. Ringkasan disimpan ke riwayat. Nama-nama, akun, dan status
          aktif/nonaktif group tidak berubah.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">Tandai Selesai & Reset</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yakin selesaikan acara?</DialogTitle>
              <DialogDescription>
                Tindakan ini akan mereset total kg ke 0, semua persentase ke
                100%, dan status &quot;sudah menerima&quot; ke belum. Ringkasan
                acara ini akan disimpan ke riwayat. Tindakan ini tidak bisa
                dibatalkan.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Batal</Button>
              </DialogClose>
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await finishEvent();
                    setOpen(false);
                    router.refresh();
                  })
                }
              >
                {isPending ? "Memproses..." : "Ya, Selesaikan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
