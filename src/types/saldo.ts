export interface SaldoAnggota {
  anggota_id: string;
  grup_id: string;
  saldo: number;
  anggota?: {
    id: string;
    nama_tampilan: string;
    user_id: string | null;
  };
}
