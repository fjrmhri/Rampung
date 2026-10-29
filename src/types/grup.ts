export interface Grup {
  id: string;
  nama: string;
  kode_undangan: string;
  dibuat_oleh: string;
  dibuat_pada: string;
}

export interface AnggotaGrup {
  id: string;
  grup_id: string;
  user_id: string | null;
  nama_tampilan: string;
  bergabung_pada: string;
}

export interface GrupDetail extends Grup {
  anggota: AnggotaGrup[];
  is_admin: boolean;
  jumlah_anggota?: number;
}
