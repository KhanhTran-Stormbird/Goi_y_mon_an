import "bootstrap/dist/css/bootstrap.min.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <main className="container mt-4">{children}</main>
      </body>
    </html>
  );
}
