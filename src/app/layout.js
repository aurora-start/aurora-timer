import "./globals.css";

export const metadata = {
  title: "Aurora Timer",
  description: "Aurora timer",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
