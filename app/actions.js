"use server";

import { scrapeProduct } from "@/lib/firecrawl";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Cierra la sesión del usuario y redirige al home.
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/");
}

/**
 * Agrega un nuevo producto o lo actualiza si ya existe para ese usuario.
 */
export async function addProduct(formData) {
  const url = formData.get("url");

  // 1. Validación inicial: Evitar llamadas innecesarias si el campo está vacío
  if (!url) {
    return { error: "Url del producto requerida" };
  }

  try {
    const supabase = await createClient();

    // 2. Control de Acceso: Solo usuarios logueados pueden guardar productos
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Usuario no autenticado" };
    }

    // 3. Extracción de Datos: Llamada a la API de Firecrawl
    const productData = await scrapeProduct(url);

    // Validación de seguridad: Si Firecrawl falla, devolvemos un error controlado
    if (!productData) {
      return {
        error: "No se pudo obtener información del enlace proporcionado.",
      };
    }

    // Validación de contenido: Aseguramos que los campos obligatorios existan
    if (!productData.productName || productData.currentPrice === undefined) {
      return {
        error: "La información extraída está incompleta o es inválida.",
      };
    }

    // 4. Limpieza de Datos: Convertir el string de precio (ej: "US$1,398.00") en número puro
    const cleanPrice = productData.currentPrice.replace(/[^0-9.]/g, "");
    const newPrice = parseFloat(cleanPrice);

    // Si el resultado no es un número válido, detenemos el proceso
    if (isNaN(newPrice)) {
      console.error("Precio inválido detectado:", productData.currentPrice);
      return { error: "El formato del precio no es válido." };
    }

    const currency = productData.currencyCode || "USD";

    // 5. Búsqueda previa: Verificar si el usuario ya está siguiendo este producto
    const { data: existingProduct } = await supabase
      .from("products")
      .select("id, current_price")
      .eq("user_id", user.id)
      .eq("url", url)
      .single();

    const isUpdate = !!existingProduct;

    // 6. Upsert (Insertar o Actualizar):
    // Si coincide user_id+url, actualiza los datos. Si no, crea una nueva fila.
    const { data: product, error } = await supabase
      .from("products")
      .upsert(
        {
          user_id: user.id,
          url: url,
          name: productData.productName,
          current_price: newPrice,
          currency: currency,
          image_url: productData.productImageUrl,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,url", // Clave única para evitar duplicados
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) throw error;

    // 7. Registro de Historial: Solo guardamos en 'price_history' si:
    // a) Es un producto nuevo.
    // b) El precio actual es distinto al último precio registrado.
    const shouldAddHistory =
      !isUpdate || existingProduct.current_price !== newPrice;

    if (shouldAddHistory) {
      await supabase.from("price_history").insert({
        product_id: product.id,
        price: newPrice,
        currency: currency,
      });
    }

    // Actualiza la interfaz de Next.js para mostrar los nuevos datos
    revalidatePath("/");

    return {
      success: true,
      product,
      message: isUpdate
        ? "Producto actualizado con el último precio"
        : "Producto agregado exitosamente",
    };
  } catch (error) {
    console.error("Add product error:", error);
    return { error: error.message || "Error al agregar el producto" };
  }
}

export async function deleteProduct(productId) {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (error) throw error;

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { error: error.message };
  }
}

export async function getProducts() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Get products error:", error);
    return [];
  }
}

export async function getPriceHistory(productId) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("price_history")
      .select("*")
      .eq("product_id", productId)
      .order("checked_at", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Get price history error:", error);
    return [];
  }
}
