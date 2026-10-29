export type JenisSplit = "sama_rata" | "persentase" | "nominal_pasti";

export interface PembagianPengeluaran {
  id?: string;
  pengeluaran_id?: string;
  anggota_id: string;
  jumlah_tanggungan: number;
  persentase?: number | null;
  anggota?: {
    id: string;
    nama_tampilan: string;
    user_id: string | null;
  };
}

export interface Pengeluaran {
  id: string;
  grup_id: string;
  dibayar_oleh: string;
  deskripsi: string;
  jumlah_total: number;
  jenis_split: JenisSplit;
  versi: number;
  dibuat_pada: string;
  diperbarui_pada: string;
  pembayar?: {
    id: string;
    nama_tampilan: string;
  };
  pembagian?: PembagianPengeluaran[];
}

export interface InputPembagian {
  anggota_id: string;
  jumlah_tanggungan: number;
  persentase?: number;
}

export interface InputTambahPengeluaran {
  grup_id: string;
  dibayar_oleh: string;
  deskripsi: string;
  jumlah_total: number;
  jenis_split: JenisSplit;
  pembagian: InputPembagian[];
}

export interface InputEditPengeluaran {
  id: string;
  grup_id: string;
  dibayar_oleh: string;
  deskripsi: string;
  jumlah_total: number;
  jenis_split: JenisSplit;
  versi_terakhir: number;
  pembagian: InputPembagian[];
}
