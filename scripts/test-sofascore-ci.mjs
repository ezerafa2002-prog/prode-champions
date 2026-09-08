import { chromium } from "playwright";

async function run() {
  console.log("=== Sofascore Champions League 2026/27 CI Test ===");
  console.log("Launching standard Chromium via Playwright (no proxies, no TLS bypass)...");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  const targetSeasonId = 96518;

  console.log("Navigating to Sofascore UEFA Champions League tournament page...");
  try {
    await page.goto("https://www.sofascore.com/tournament/football/europe/uefa-champions-league/7", {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
  } catch (err) {
    console.warn("Navigation warning (continuing):", err.message);
  }

  // Esperar brevemente a que el cliente de Sofascore complete su carga inicial
  await page.waitForTimeout(4000);

  // Consultar directamente el endpoint de la Fecha 1 de la temporada 2026/27 desde el contexto del navegador
  const round1Url = `https://www.sofascore.com/api/v1/unique-tournament/7/season/${targetSeasonId}/events/round/1`;
  console.log(`Fetching Round 1 endpoint from page context: ${round1Url}`);

  const apiResult = await page.evaluate(async (url) => {
    try {
      const resp = await fetch(url, {
        headers: {
          Accept: "application/json, text/plain, */*",
        },
      });
      const status = resp.status;
      const statusText = resp.statusText;
      let body = null;
      try {
        body = await resp.json();
      } catch {
        body = await resp.text();
      }
      return { ok: resp.ok, status, statusText, body };
    } catch (e) {
      return { ok: false, status: 0, statusText: e.message, body: null };
    }
  }, round1Url);

  await browser.close();

  console.log("\n--- RESULTADOS DE LA PRUEBA ---");
  console.log(`HTTP Status: ${apiResult.status} ${apiResult.statusText}`);

  if (apiResult.status !== 200 || !apiResult.body) {
    console.error("Fallo al obtener respuesta 200 de Sofascore.");
    console.error("Respuesta recibida:", JSON.stringify(apiResult.body).slice(0, 300));
    process.exit(1);
  }

  const events = apiResult.body.events || [];
  console.log(`Temporada verificada: ${targetSeasonId}`);
  console.log(`Cantidad de partidos obtenidos en Fecha 1: ${events.length}`);

  if (events.length > 0) {
    const sample = events[0];
    console.log("\nPartido de muestra:");
    console.log(`- Event ID: ${sample.id}`);
    console.log(`- Local: ${sample.homeTeam?.name} (ID: ${sample.homeTeam?.id})`);
    console.log(`- Visitante: ${sample.awayTeam?.name} (ID: ${sample.awayTeam?.id})`);
    console.log(`- Kickoff UTC: ${new Date(sample.startTimestamp * 1000).toISOString()}`);
    console.log(`- Estado: ${sample.status?.description} (${sample.status?.type})`);
  } else {
    console.warn("Advertencia: No se encontraron eventos en la respuesta.");
  }

  // Verificar que la temporada en el payload sea efectivamente 96518
  const seasonMatch = events.some((e) => e.season?.id === targetSeasonId);
  if (!seasonMatch) {
    console.error(`Error: Ningún evento coincidió con la temporada ${targetSeasonId}.`);
    process.exit(1);
  }

  console.log("\n✅ Prueba completada con éxito: Sofascore respondió 200 con datos reales de la temporada 96518.");
}

run().catch((err) => {
  console.error("Error inesperado durante la ejecución:", err);
  process.exit(1);
});
