export const metadata = {
  title: "Jarvis",
  description: "Tu asistente personal",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0b0b0b",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, background: "#0b0b0b", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
