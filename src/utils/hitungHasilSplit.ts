import type { InputPembagian, JenisSplit } from "@/types/pengeluaran";

export interface HasilSplit {
  isValid: boolean;
  errorText?: string;
  pembagian: InputPembagian[];
}

// Kalkulasi Split berdasarkan jenis_split
export function hitungHasilSplit(
  selectedAnggotaIds: string[],
  jumlahTotal: number,
  jenisSplit: JenisSplit,
  persentaseMap: Record<string, string>,
  nominalMap: Record<string, string>,
): HasilSplit {
  if (selectedAnggotaIds.length === 0) {
    return {
      isValid: false,
      errorText: "Pilih minimal 1 anggota untuk membagi pengeluaran",
      pembagian: [],
    };
  }

  if (jumlahTotal <= 0) {
    return {
      isValid: false,
      errorText: "Jumlah total harus lebih dari 0",
      pembagian: [],
    };
  }

  if (jenisSplit === "sama_rata") {
    const count = selectedAnggotaIds.length;
    const baseShare = Math.floor(jumlahTotal / count);
    let remainder = jumlahTotal - baseShare * count;

    const pembagian: InputPembagian[] = selectedAnggotaIds.map((anggotaId) => {
      let share = baseShare;
      if (remainder > 0) {
        share += 1;
        remainder -= 1;
      }
      return {
        anggota_id: anggotaId,
        jumlah_tanggungan: share,
      };
    });

    return { isValid: true, pembagian };
  }

  if (jenisSplit === "persentase") {
    let totalPersentase = 0;
    const tempItems: { anggotaId: string; pct: number }[] = [];

    for (const id of selectedAnggotaIds) {
      const valStr = persentaseMap[id] || "0";
      const pct = parseFloat(valStr);
      if (isNaN(pct) || pct < 0) {
        return {
          isValid: false,
          errorText: "Persentase tidak boleh negatif atau kosong",
          pembagian: [],
        };
      }
      totalPersentase += pct;
      tempItems.push({ anggotaId: id, pct });
    }

    if (Math.abs(totalPersentase - 100) > 0.01) {
      return {
        isValid: false,
        errorText: `Total persentase harus 100% (saat ini: ${totalPersentase.toFixed(1)}%)`,
        pembagian: [],
      };
    }

    let totalCalculated = 0;
    const pembagian: InputPembagian[] = tempItems.map((item, idx) => {
      let tanggungan = Math.round((item.pct / 100) * jumlahTotal);
      if (idx === tempItems.length - 1) {
        // Penyesuaian rounding untuk anggota terakhir agar pas jumlahTotal
        tanggungan = jumlahTotal - totalCalculated;
      } else {
        totalCalculated += tanggungan;
      }
      return {
        anggota_id: item.anggotaId,
        jumlah_tanggungan: tanggungan,
        persentase: item.pct,
      };
    });

    return { isValid: true, pembagian };
  }

  if (jenisSplit === "nominal_pasti") {
    let totalNominal = 0;
    const pembagian: InputPembagian[] = [];

    for (const id of selectedAnggotaIds) {
      const valStr = nominalMap[id] || "0";
      const nominal = parseInt(valStr.replace(/\D/g, ""), 10) || 0;
      if (nominal < 0) {
        return {
          isValid: false,
          errorText: "Nominal tidak boleh negatif",
          pembagian: [],
        };
      }
      totalNominal += nominal;
      pembagian.push({
        anggota_id: id,
        jumlah_tanggungan: nominal,
      });
    }

    if (totalNominal !== jumlahTotal) {
      const selisih = jumlahTotal - totalNominal;
      return {
        isValid: false,
        errorText: `Total nominal (Rp ${totalNominal.toLocaleString(
          "id-ID"
        )}) ${selisih > 0 ? "kurang" : "lebih"} Rp ${Math.abs(
          selisih
        ).toLocaleString("id-ID")} dari Jumlah Total (Rp ${jumlahTotal.toLocaleString(
          "id-ID"
        )})`,
        pembagian: [],
      };
    }

    return { isValid: true, pembagian };
  }

  return { isValid: false, errorText: "Jenis split tidak valid", pembagian: [] };
}
