export interface TransaksiPelunasanDB {
  id: string;
  grup_id: string;
  dari_anggota_id: string;
  ke_anggota_id: string;
  jumlah: number;
  status: "pending" | "lunas";
  dibuat_pada: string;
  lunas_pada?: string | null;
  dari_anggota?: {
    id: string;
    nama_tampilan: string;
  };
  ke_anggota?: {
    id: string;
    nama_tampilan: string;
  };
}
