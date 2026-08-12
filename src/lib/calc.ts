/**
 * Perhitungan pembagian daging kurban.
 *
 * total_bobot = jumlah(persentase panitia) + jumlah(persentase peserta di group aktif)
 * nilai_per_1_persen = total_kg / total_bobot
 * kg_per_orang = nilai_per_1_persen * persentase_orang
 *
 * Panitia tidak terikat group, jadi selalu ikut dihitung.
 * Peserta di group yang nonaktif dikeluarkan dari perhitungan.
 */

export interface Weighted {
  id: string;
  name: string;
  percentage: number;
}

export interface DistributionResult extends Weighted {
  kg: number;
}

export function calculateDistribution(
  totalKg: number,
  panitia: Weighted[],
  pesertaAktif: Weighted[]
): {
  totalBobot: number;
  nilaiPer1Persen: number;
  panitiaResult: DistributionResult[];
  pesertaResult: DistributionResult[];
} {
  const totalBobot =
    panitia.reduce((sum, p) => sum + p.percentage, 0) +
    pesertaAktif.reduce((sum, p) => sum + p.percentage, 0);

  const nilaiPer1Persen = totalBobot > 0 ? totalKg / totalBobot : 0;

  const panitiaResult = panitia.map((p) => ({
    ...p,
    kg: p.percentage * nilaiPer1Persen,
  }));

  const pesertaResult = pesertaAktif.map((p) => ({
    ...p,
    kg: p.percentage * nilaiPer1Persen,
  }));

  return { totalBobot, nilaiPer1Persen, panitiaResult, pesertaResult };
}
