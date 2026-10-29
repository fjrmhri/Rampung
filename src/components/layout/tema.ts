export const THEME_STORAGE_KEY = "rampung-theme";

/**
 * Dijalankan inline di <head> sebelum halaman tampil agar tidak ada kedipan
 * tema: pakai pilihan tersimpan, jika tidak ada ikuti prefers-color-scheme.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}})()`;
