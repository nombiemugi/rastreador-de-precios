import AddProductForm from "@/components/AddProductForm";
import AuthButton from "@/components/ui/AuthButton";
import { createClient } from "@/utils/supabase/server";
import { Bell, LogIn, Rabbit, Shield, TrendingDown } from "lucide-react";
import Image from "next/image";
import { getProducts } from "./actions";
import ProductCard from "@/components/ProductCard";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const products = user ? await getProducts() : [];

  const FEATURES = [
    {
      icon: Rabbit,
      title: "Información instantánea",
      description:
        "Extrae precios y detalles del producto en segundos con nuestra tecnologia avanzada",
    },
    {
      icon: Shield,
      title: "Siempre confiable",
      description:
        "Funciona en los principales sitios de comercio electrónico con protección anti-bots integrada.",
    },
    {
      icon: Bell,
      title: "Alertas inteligentes",
      description:
        "Recibe notificaciones al instante cuando los precios bajen de tu objetivo.",
    },
  ];

  return (
    <main className="min-h-screen bg-linear-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/brand-logo-light.png"
              alt="Rastrea tu producto Logo"
              width={600}
              height={200}
              className="h-10 w-auto"
            />
          </div>

          {/* auth button */}
          <AuthButton user={user} />
        </div>
      </header>

      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-6 py-2 rounded-full text-sm font-medium mb-6">
            Hecho con ❤️ por{" "}
            <a href="https://andressoler.netlify.app/" target="_blank">
              Andres Soler{" "}
            </a>
          </div>

          <h2 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            No te pierdas nunca una oferta.
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Rastrea tus productos favoritos de cualquier tienda en linea. Recibe
            alertas instantaneas cuando los precios bajen.
          </p>

          <AddProductForm user={user} />

          {/* Features */}
          {products.length === 0 && (
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="bg-white p-6 rounded-xl border border-gray-200"
                >
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                    <Icon className="w-6 h-6 text-orange-500" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-600">{description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Client for each user */}
      {/* Products Grid */}
      {user && products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-20">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              Tus productos rastreados
            </h3>
            <span className="text-sm text-gray-500">
              {products.length}{" "}
              {products.length === 1 ? "producto" : "productos"}
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2 items-start">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {user && products.length === 0 && (
        <section className="max-w-2xl mx-auto px-4 pb-20 text-center">
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12">
            <TrendingDown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Sin productos
            </h3>
            <p className="text-gray-600">
              Agrega tu primer producto para empezar a rastrear sus precios!
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
