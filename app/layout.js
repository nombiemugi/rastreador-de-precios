import "./brand.css";
import "./globals.css";

export const metadata = {
  title: "Rastreador de Precios",
  description: "Rastrea tus productos favoritos y recibe alertas de cambios de precio.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
