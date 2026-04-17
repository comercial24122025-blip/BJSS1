const PIPELINE_ORDER = ["New Business", "Legal", "DD", "Integration", "Go Live", "Live / Growth"];

const REQUIRED_COLUMNS = [
  "KPI Block",
  "Market",
  "Client",
  "Raw Status",
  "Agreement Status",
  "DD Status",
  "Integration Status",
  "Go Live Flag",
  "Stage",
  "Pipeline Value (€)",
  "Created Date",
  "Last Update",
  "Brands / Commercials",
  "Entity & Company Info",
  "URL",
  "Jira",
  "DD TKT",
  "Integration TKT",
  "Integration Email",
  "Next Action",
  "Data Quality Flag"
];

const KPI_MANUAL_KEYS = [
  "Market Penetration %",
  "Growth vs prior quarter",
  "Existing Client Expansion",
  "Relationship Development",
  "Collections Support",
  "Strategic Projects Opened"
];

let sourceRaw = "";
let pipelineData = [];
let manualKpisByMarket = {};

function detectDelimiter(text) {
  const firstLine = text.split("\n")[0] || "";
  return firstLine.includes("\t") ? "\t" : ",";
}

function parseRows(text) {
  const delimiter = detectDelimiter(text);
  const lines = text.trim().split("\n").filter(Boolean);
  if (!lines.length) return [];

  const headers = lines[0].split(delimiter).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(delimiter).map((v) => v.trim());
    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || "";
    });
    return normalizeRow(row);
  });
}

function normalizeRow(row) {
  const normalized = {};
  REQUIRED_COLUMNS.forEach((col) => {
    normalized[col] = row[col] || "";
  });

  if (!normalized.Market) normalized.Market = row.Country || row.País || "Unknown";
  if (!normalized.Client) normalized.Client = row.Deal || row.Cliente || "Unnamed deal";

  const inferredStage = inferStage(normalized);
  normalized.Stage = normalized.Stage || inferredStage;
  normalized["KPI Block"] = kpiBlockForStage(normalized.Stage);

  const value = Number((normalized["Pipeline Value (€)"] || "0").replace(/[^\d.-]/g, ""));
  normalized["Pipeline Value (€)"] = Number.isFinite(value) ? value : 0;
  normalized["Data Quality Flag"] = qualityFlag(normalized);

  return normalized;
}

function inferStage(row) {
  const gl = String(row["Go Live Flag"] || "").toLowerCase();
  const integration = String(row["Integration Status"] || "").toLowerCase();
  const dd = String(row["DD Status"] || "").toLowerCase();
  const agreement = String(row["Agreement Status"] || "").toLowerCase();

  if (["yes", "true", "1", "go live", "live"].some((v) => gl.includes(v))) return "Go Live";
  if (["integration", "in progress", "ready", "done"].some((v) => integration.includes(v))) return "Integration";
  if (["dd", "due diligence", "in progress", "ready", "done"].some((v) => dd.includes(v))) return "DD";
  if (["legal", "agreement", "contract", "signed", "review"].some((v) => agreement.includes(v))) return "Legal";
  return "New Business";
}

function kpiBlockForStage(stage) {
  if (["New Business", "Legal", "DD", "Integration", "Go Live"].includes(stage)) return "Commercial Execution";
  return "Market Performance";
}

function qualityFlag(row) {
  const required = ["Market", "Client", "Stage"];
  return required.every((k) => row[k]) ? "OK" : "Needs review";
}

function groupedByMarket() {
  return pipelineData.reduce((acc, row) => {
    acc[row.Market] ||= [];
    acc[row.Market].push(row);
    return acc;
  }, {});
}

function computeSummaryRows() {
  const map = new Map();
  pipelineData.forEach((r) => {
    const key = `${r["KPI Block"]}|${r.Market}|${r.Stage}`;
    const prev = map.get(key) || { deals: 0, value: 0, kpiBlock: r["KPI Block"], market: r.Market, stage: r.Stage };
    prev.deals += 1;
    prev.value += Number(r["Pipeline Value (€)"] || 0);
    map.set(key, prev);
  });
  return Array.from(map.values()).sort((a, b) => a.market.localeCompare(b.market) || PIPELINE_ORDER.indexOf(a.stage) - PIPELINE_ORDER.indexOf(b.stage));
}

function renderTable(el, headers, rows) {
  el.innerHTML = "";
  const thead = document.createElement("thead");
  thead.innerHTML = `<tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>`;
  const tbody = document.createElement("tbody");

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = headers.map((h) => `<td>${row[h] ?? ""}</td>`).join("");
    tbody.appendChild(tr);
  });

  el.appendChild(thead);
  el.appendChild(tbody);
}

function renderMeasurementBlocks() {
  const blocksEl = document.getElementById("measurementBlocks");
  const total = pipelineData.length || 1;
  const byStage = PIPELINE_ORDER.reduce((acc, stage) => {
    acc[stage] = pipelineData.filter((r) => r.Stage === stage);
    return acc;
  }, {});

  let conversion = 0;
  for (let i = 0; i < PIPELINE_ORDER.length - 1; i += 1) {
    const current = byStage[PIPELINE_ORDER[i]].length || 1;
    const next = byStage[PIPELINE_ORDER[i + 1]].length;
    conversion += next / current;
  }
  conversion = Math.round((conversion / (PIPELINE_ORDER.length - 1)) * 100);

  const avgSpeed = Math.round(
    pipelineData
      .map((r) => {
        const c = new Date(r["Created Date"] || Date.now());
        const u = new Date(r["Last Update"] || Date.now());
        return Math.max(0, (u - c) / 86400000);
      })
      .reduce((a, b) => a + b, 0) / total
  );

  const totalValue = pipelineData.reduce((sum, r) => sum + Number(r["Pipeline Value (€)"] || 0), 0);

  const cards = [
    { title: "1. Conversion", value: `${conversion || 0}%`, desc: "Clientes que avanzan de una etapa a otra." },
    { title: "2. Speed", value: `${avgSpeed || 0} días`, desc: "Tiempo promedio para mover deals por pipeline." },
    { title: "3. Value", value: `€${totalValue.toLocaleString()}`, desc: "Revenue / valor comercial total en el pipeline." }
  ];

  blocksEl.innerHTML = cards
    .map((c) => `<div class="metric"><h3>${c.title}</h3><strong>${c.value}</strong><p>${c.desc}</p></div>`)
    .join("");
}

function renderDashboardSummary() {
  const rows = computeSummaryRows().map((r) => ({
    "KPI Block": r.kpiBlock,
    Market: r.market,
    Stage: r.stage,
    "# Deals": r.deals,
    "Pipeline Value (€)": `€${Math.round(r.value).toLocaleString()}`
  }));
  renderTable(document.getElementById("summaryTable"), ["KPI Block", "Market", "Stage", "# Deals", "Pipeline Value (€)"], rows);
}

function renderMarketKpiInput() {
  const marketMap = groupedByMarket();
  const markets = Object.keys(marketMap);
  const rows = markets.map((market) => {
    manualKpisByMarket[market] ||= Object.fromEntries(KPI_MANUAL_KEYS.map((k) => [k, ""]));
    return { Market: market, ...manualKpisByMarket[market] };
  });
  renderTable(document.getElementById("kpiInputTable"), ["Market", ...KPI_MANUAL_KEYS], rows);
}

function renderDashboardByMarket() {
  const container = document.getElementById("marketCards");
  const marketMap = groupedByMarket();
  container.innerHTML = "";

  Object.entries(marketMap).forEach(([market, rows]) => {
    const stages = PIPELINE_ORDER.reduce((acc, s) => ({ ...acc, [s]: rows.filter((r) => r.Stage === s).length }), {});
    const revenue = rows.reduce((sum, r) => sum + Number(r["Pipeline Value (€)"] || 0), 0);

    const card = document.createElement("article");
    card.className = "market-card";
    card.innerHTML = `
      <h3>${market}</h3>
      <small><strong>Commercial Execution:</strong> New Business ${stages["New Business"]}, Legal ${stages.Legal}, DD ${stages.DD}, Integration ${stages.Integration}, Go Live ${stages["Go Live"]}</small>
      <p><strong>Market Performance</strong></p>
      <ul>
        <li>New Sales: ${stages["New Business"]}</li>
        <li>New Go Lives: ${stages["Go Live"]}</li>
        <li>Revenue Added: €${Math.round(revenue).toLocaleString()}</li>
      </ul>
      <p><strong>Strategic Contribution</strong></p>
      <ul>
        <li>Existing Client Expansion, Relationship Development, Collections Support, Strategic Projects Opened (manual).</li>
      </ul>
    `;

    container.appendChild(card);
  });
}

function renderMarketDetailSelector() {
  const selector = document.getElementById("marketSelector");
  const marketMap = groupedByMarket();
  const markets = Object.keys(marketMap);
  selector.innerHTML = markets.map((m) => `<option value="${m}">${m}</option>`).join("");
  selector.onchange = () => renderMarketDetail(selector.value);
  if (markets.length) renderMarketDetail(markets[0]);
}

function renderBars(rows, key, formatter = (x) => x) {
  const grouped = PIPELINE_ORDER.map((stage) => {
    const stageRows = rows.filter((r) => r.Stage === stage);
    const value = key === "count" ? stageRows.length : stageRows.reduce((sum, r) => sum + Number(r["Pipeline Value (€)"] || 0), 0);
    return { stage, value };
  });
  const max = Math.max(1, ...grouped.map((g) => g.value));

  return grouped
    .map(
      (g) => `
      <div><strong>${g.stage}</strong></div>
      <div class="bar"><div class="fill" style="width:${Math.max(5, (g.value / max) * 100)}%">${formatter(g.value)}</div></div>
    `
    )
    .join("");
}

function renderMarketDetail(market) {
  const detail = document.getElementById("marketDetail");
  const rows = groupedByMarket()[market] || [];
  detail.innerHTML = `
    <h3>${market} – resumen ejecutivo</h3>
    <p>Deals activos: <strong>${rows.length}</strong> | Pipeline Value: <strong>€${Math.round(rows.reduce((s, r) => s + Number(r["Pipeline Value (€)"] || 0), 0)).toLocaleString()}</strong></p>
    <h4>Gráfico: # Deals by Stage</h4>
    ${renderBars(rows, "count")}
    <h4>Gráfico: Pipeline Value by Stage</h4>
    ${renderBars(rows, "value", (x) => `€${Math.round(x).toLocaleString()}`)}
    <h4>Tabla de clientes</h4>
    <table>
      <thead><tr><th>Client</th><th>Stage</th><th>Pipeline Value (€)</th><th>Next Action</th><th>Jira</th><th>DD TKT</th><th>Integration TKT</th></tr></thead>
      <tbody>
      ${rows
        .map(
          (r) => `<tr><td>${r.Client}</td><td>${r.Stage}</td><td>€${Math.round(r["Pipeline Value (€)"]).toLocaleString()}</td><td>${r["Next Action"]}</td><td>${r.Jira}</td><td>${r["DD TKT"]}</td><td>${r["Integration TKT"]}</td></tr>`
        )
        .join("")}
      </tbody>
    </table>
  `;
}

function renderPipelineData() {
  renderTable(document.getElementById("pipelineTable"), REQUIRED_COLUMNS, pipelineData);
}

function renderKpiCatalog() {
  const catalog = [
    "Commercial Execution",
    "Market Performance",
    "Strategic Contribution",
    "Conversion",
    "Speed",
    "Value",
    ...KPI_MANUAL_KEYS
  ];
  document.getElementById("kpiCatalog").innerHTML = catalog.map((k) => `<li>${k}</li>`).join("");
}

function renderSourceRaw() {
  document.getElementById("sourceRaw").textContent = sourceRaw;
}

function rerenderAll() {
  renderMeasurementBlocks();
  renderDashboardSummary();
  renderDashboardByMarket();
  renderMarketKpiInput();
  renderMarketDetailSelector();
  renderPipelineData();
  renderKpiCatalog();
  renderSourceRaw();
}

document.getElementById("loadBtn").addEventListener("click", () => {
  sourceRaw = document.getElementById("rawInput").value;
  pipelineData = parseRows(sourceRaw);
  rerenderAll();
});

document.getElementById("sampleBtn").addEventListener("click", () => {
  const sample = `Market,Client,Raw Status,Agreement Status,DD Status,Integration Status,Go Live Flag,Pipeline Value (€),Created Date,Last Update,Brands / Commercials,Entity & Company Info,URL,Jira,DD TKT,Integration TKT,Integration Email,Next Action\nES,Acme Pharma,lead,contract review,requested,,no,120000,2026-01-05,2026-02-02,Brand A,ACME SA,https://acme.example,JRA-11,DD-101,,ops@acme.example,Send legal update\nES,Blue Retail,legal,signed,completed,in progress,no,210000,2026-01-10,2026-03-15,Brand B,Blue SL,https://blue.example,JRA-12,DD-102,INT-21,int@blue.example,Track integration\nMX,Fintech Nova,prospect,,,setup,yes,300000,2026-02-01,2026-03-30,Brand C,Nova MX,https://nova.example,JRA-13,,INT-22,launch@nova.example,Prepare growth plan`;
  document.getElementById("rawInput").value = sample;
  sourceRaw = sample;
  pipelineData = parseRows(sample);
  rerenderAll();
});

renderKpiCatalog();
