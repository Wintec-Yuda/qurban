"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Peserta } from "@prisma/client";
import {
  addPeserta,
  deletePeserta,
  editPesertaName,
  toggleSudahMenerima,
} from "@/lib/actions/peserta-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Pencil, Check, X } from "lucide-react";

export function PesertaManager({
  initialPeserta,
}: {
  initialPeserta: Peserta[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const peserta = initialPeserta;

  const sudahCount = peserta.filter((p) => p.sudahMenerima).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Penerima</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const formData = new FormData(form);
              setError(null);
              startTransition(async () => {
                const res = await addPeserta(undefined, formData);
                if (res?.error) {
                  setError(res.error);
                } else {
                  form.reset();
                  router.refresh();
                }
              });
            }}
          >
            <Input name="name" placeholder="Nama penerima" required />
            <Button type="submit" disabled={isPending}>
              Tambah
            </Button>
          </form>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Daftar Penerima ({peserta.length}) — Sudah menerima: {sudahCount}/
            {peserta.length}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">Sudah</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="w-24 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {peserta.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Checkbox
                      checked={p.sudahMenerima}
                      onCheckedChange={(checked) => {
                        const value = checked === true;
                        startTransition(async () => {
                          await toggleSudahMenerima(p.id, value);
                          router.refresh();
                        });
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {editingId === p.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-8"
                          autoFocus
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => {
                            const value = editValue;
                            setEditingId(null);
                            startTransition(async () => {
                              await editPesertaName(p.id, value);
                              router.refresh();
                            });
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <span
                        className={
                          p.sudahMenerima
                            ? "text-muted-foreground line-through"
                            : ""
                        }
                      >
                        {p.name}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingId(p.id);
                          setEditValue(p.name);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => {
                          startTransition(async () => {
                            await deletePeserta(p.id);
                            router.refresh();
                          });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {peserta.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    Belum ada penerima.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
