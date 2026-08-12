"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Panitia, Peserta, Group, User } from "@prisma/client";
import { setTotalKg } from "@/lib/actions/pengaturan-actions";
import {
  addPanitia,
  deletePanitia,
  editPanitiaName,
  editPanitiaPercentage,
  bulkSetPanitiaPercentage,
} from "@/lib/actions/panitia-actions";
import {
  editPesertaPercentage,
  bulkSetGroupPercentage,
} from "@/lib/actions/peserta-actions";
import type { DistributionResult } from "@/lib/calc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2 } from "lucide-react";

type GroupWithRelations = Group & { peserta: Peserta[]; leader: User | null };

function fmtKg(n: number) {
  return n.toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

export function SekretarisDashboard({
  totalKg,
  panitia,
  groups,
  result,
}: {
  totalKg: number;
  panitia: Panitia[];
  groups: GroupWithRelations[];
  result: {
    totalBobot: number;
    nilaiPer1Persen: number;
    panitiaResult: DistributionResult[];
    pesertaResult: DistributionResult[];
  };
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <Tabs defaultValue="kelola" className="space-y-6">
      <TabsList>
        <TabsTrigger value="kelola">Kelola Data</TabsTrigger>
        <TabsTrigger value="hasil">Hasil Pembagian</TabsTrigger>
      </TabsList>

      <TabsContent value="kelola" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Daging Siap</CardTitle>
            <CardDescription>
              Bisa diupdate/ditambah kapan saja. Bobot total saat ini:{" "}
              {fmtKg(result.totalBobot)}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                startTransition(async () => {
                  await setTotalKg(undefined, formData);
                  router.refresh();
                });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="totalKg">Total Kg</Label>
                <Input
                  id="totalKg"
                  name="totalKg"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={totalKg}
                  className="w-40"
                />
              </div>
              <Button type="submit">Simpan</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Panitia ({panitia.length})</CardTitle>
            <CardDescription>
              Panitia tidak terikat group, selalu ikut pembagian.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                startTransition(async () => {
                  await addPanitia(undefined, formData);
                  form.reset();
                  router.refresh();
                });
              }}
            >
              <Input name="name" placeholder="Nama panitia" required />
              <Button type="submit">Tambah</Button>
            </form>

            <div className="flex items-end gap-2 border-t pt-4">
              <div className="space-y-2">
                <Label>Set persentase semua panitia</Label>
                <BulkPercentageForm
                  onSubmit={(pct) =>
                    startTransition(async () => {
                      await bulkSetPanitiaPercentage(pct);
                      router.refresh();
                    })
                  }
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead className="w-32">Persentase</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {panitia.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <InlineTextEdit
                        value={p.name}
                        onSave={(v) =>
                          startTransition(async () => {
                            await editPanitiaName(p.id, v);
                            router.refresh();
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <InlinePercentEdit
                        value={p.percentage}
                        onSave={(v) =>
                          startTransition(async () => {
                            await editPanitiaPercentage(p.id, v);
                            router.refresh();
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() =>
                          startTransition(async () => {
                            await deletePanitia(p.id);
                            router.refresh();
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {panitia.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Belum ada panitia.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Persentase Peserta per Group</CardTitle>
            <CardDescription>
              Nama & jumlah peserta dikelola oleh Ketua Group masing-masing. Di
              sini Anda hanya mengatur persentasenya.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {groups.map((g) => (
              <div key={g.id} className="space-y-2 border-b pb-4 last:border-b-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{g.name}</h3>
                  <Badge variant={g.isActive ? "default" : "secondary"}>
                    {g.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ({g.peserta.length} peserta)
                  </span>
                </div>
                {g.isActive && g.peserta.length > 0 && (
                  <div className="flex items-end gap-2">
                    <Label className="text-xs">Set persentase semua peserta group ini</Label>
                    <BulkPercentageForm
                      onSubmit={(pct) =>
                        startTransition(async () => {
                          await bulkSetGroupPercentage(g.id, pct);
                          router.refresh();
                        })
                      }
                    />
                  </div>
                )}
                {g.peserta.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead className="w-32">Persentase</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {g.peserta.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.name}</TableCell>
                          <TableCell>
                            <InlinePercentEdit
                              value={p.percentage}
                              disabled={!g.isActive}
                              onSave={(v) =>
                                startTransition(async () => {
                                  await editPesertaPercentage(p.id, v);
                                  router.refresh();
                                })
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            ))}
            {groups.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada group.</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="hasil">
        <Card>
          <CardHeader>
            <CardTitle>Hasil Pembagian</CardTitle>
            <CardDescription>
              Total {fmtKg(totalKg)} kg ÷ {fmtKg(result.totalBobot)}% bobot ={" "}
              {fmtKg(result.nilaiPer1Persen)} kg per 1%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="w-24">Persentase</TableHead>
                  <TableHead className="w-28 text-right">Kg Diterima</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.panitiaResult.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">Panitia</Badge>
                    </TableCell>
                    <TableCell>{p.percentage}%</TableCell>
                    <TableCell className="text-right">{fmtKg(p.kg)} kg</TableCell>
                  </TableRow>
                ))}
                {result.pesertaResult.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">Peserta</Badge>
                    </TableCell>
                    <TableCell>{p.percentage}%</TableCell>
                    <TableCell className="text-right">{fmtKg(p.kg)} kg</TableCell>
                  </TableRow>
                ))}
                {result.panitiaResult.length + result.pesertaResult.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Belum ada data untuk dihitung.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

function InlineTextEdit({
  value,
  onSave,
}: {
  value: string;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value);
  if (!editing) {
    return (
      <button
        type="button"
        className="text-left hover:underline"
        onClick={() => setEditing(true)}
      >
        {value}
      </button>
    );
  }
  return (
    <Input
      className="h-8 w-40"
      value={v}
      autoFocus
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        setEditing(false);
        if (v !== value && v.trim()) onSave(v.trim());
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
      }}
    />
  );
}

function InlinePercentEdit({
  value,
  onSave,
  disabled,
}: {
  value: number;
  onSave: (v: number) => void;
  disabled?: boolean;
}) {
  const [v, setV] = useState(String(value));
  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        step="1"
        min="0"
        disabled={disabled}
        className="h-8 w-20"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onBlur={() => {
          const num = Number(v);
          if (!Number.isNaN(num) && num !== value) onSave(num);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
      <span className="text-sm text-muted-foreground">%</span>
    </div>
  );
}

function BulkPercentageForm({ onSubmit }: { onSubmit: (pct: number) => void }) {
  const [v, setV] = useState("100");
  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        step="1"
        min="0"
        className="h-8 w-20"
        value={v}
        onChange={(e) => setV(e.target.value)}
      />
      <span className="text-sm text-muted-foreground">%</span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          const num = Number(v);
          if (!Number.isNaN(num)) onSubmit(num);
        }}
      >
        Terapkan
      </Button>
    </div>
  );
}
