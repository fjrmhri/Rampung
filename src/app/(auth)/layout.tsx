/**
 * Layout grup route (auth) — tidak menambahkan wrapping khusus,
 * cukup render children. Styling halaman ada di masing-masing page.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
