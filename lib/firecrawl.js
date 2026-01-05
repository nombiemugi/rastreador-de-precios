export async function scrapeProduct(url) {
  try {
    const apiURL = "https://api.firecrawl.dev/v2/scrape";
    const apiKey = process.env.FIRECRAWL_API_KEY;

    const response = await fetch(apiURL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: url,
        onlyMainContent: true,
        formats: [
          {
            type: "json",
            schema: {
              type: "object",
              required: ["productName", "currentPrice"],
              properties: {
                productName: { type: "string" },
                currentPrice: { type: "string" },
                currencyCode: { type: "string" },
                productImageUrl: { type: "string" },
              },
            },
            prompt:
              "Extract product info: name as 'productName', price as 'currentPrice', currency code as 'currencyCode', and image URL as 'productImageUrl'.",
          },
        ],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();

    // Retornamos solo el objeto JSON extraído por la IA
    return result.data?.json || result.data || null;
  } catch (error) {
    console.error("Firecrawl connection error:", error.message);
    return null;
  }
}
