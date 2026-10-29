/**
 * Layout grup route (auth) — hanya membungkus halaman dengan landmark
 * <main>. Styling halaman ada di masing-masing page.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="flex flex-1 flex-col">{children}</main>;
}
