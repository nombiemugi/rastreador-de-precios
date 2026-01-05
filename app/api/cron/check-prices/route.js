import { sendPriceDropAlert } from "@/lib/email";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Price check endpoint hit succesfully. Use POST to trigger.",
  });
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*");

    if (productsError) throw productsError;

    console.log(`Found ${products.length} products to check prices for.`);

    const results = {
      total: products.length,
      updated: 0,
      failed: 0,
      priceChanges: 0,
      alertsSent: 0,
    };

    for (const product of products) {
      try {
        const productData = await scrapeProduct(product.url);

        if (!productData.currentPrice) {
          results.failed++;
          continue;
        }

        const newPrice = parseFloat(
          productData.currentPrice.replace(/[^0-9.-]+/g, "")
        );
        const oldPrice = parseFloat(product.current_price);

        await supabase
          .from("products")
          .update({
            current_price: newPrice,
            currency: productData.currency || product.currency,
            name: productData.name || product.name,
            image_url: productData.imageUrl || product.image_url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.id);

        if (oldPrice !== newPrice) {
          await supabase.from("price_history").insert({
            product_id: product.id,
            price: newPrice,
            currency: productData.currencyCode || product.currency,
          });

          results.priceChanges++;

          if (newPrice < oldPrice) {
            // Alert

            const {
              data: { user },
            } = await supabase.auth.admin.getUserById(product.user_id);

            if (user?.email) {
              //send email
              const emailResult = await sendPriceDropAlert(
                user.email,
                product,
                oldPrice,
                newPrice
              );

              if (emailResult.success) {
                results.alertsSent++;
              }
            }

            results.updated++;
          }
        }
      } catch (error) {
        console.error(`Error procesando el producto ${product.id}:`, error);
        results.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Price check completed",
      results,
    });
  } catch (error) {
    console.error("Cron Job Error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
