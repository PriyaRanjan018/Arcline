export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: "#080808", minHeight: "100vh" }}>
      {children}
    </div>
  );
}
