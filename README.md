# BD_Pipeline_K

Aplicación web ligera para business development y sales follow-up.

## Qué incluye

- **Pipeline visual**: `New Business → Legal → DD → Integration → Go Live → Live / Growth`.
- **3 bloques de medición**:
  - Conversion
  - Speed
  - Value
- **Carga de raw data por texto pegado** en `Pipeline_Data` (CSV o TSV).
- **Source_Raw** para trazabilidad del input original.
- **Dashboard_Summary** con agregación por `KPI Block`, `Market`, `Stage`, `# Deals`, `Pipeline Value (€)`.
- **Dashboard_By_Market** distribuido por país con bloques de:
  - Commercial Execution
  - Market Performance
  - Strategic Contribution
- **Market_KPI_Input** para KPIs manuales:
  - Market Penetration %
  - Growth vs prior quarter
  - Existing Client Expansion
  - Relationship Development
  - Collections Support
  - Strategic Projects Opened
- **Hojas por mercado (vistas)** con:
  - Resumen ejecutivo
  - Tabla de clientes
  - Gráfico de `# Deals by Stage`
  - Gráfico de `Pipeline Value by Stage`
- **KPI_Catalog** ampliado.

## Lógica de stage (inferencia automática)

Prioridad de inferencia:
1. **Go Live** (según `Go Live Flag`)
2. **Integration** (según `Integration Status`)
3. **DD** (según `DD Status`)
4. **Legal** (según `Agreement Status`)
5. **New Business** (fallback)

## Columnas de seguimiento reforzadas

- KPI Block
- Raw Status
- Agreement Status
- DD Status
- Integration Status
- Go Live Flag
- Brands / Commercials
- Entity & Company Info
- URL
- Jira
- DD TKT
- Integration TKT
- Integration Email
- Next Action
- Data Quality Flag

## Ejecutar

Como es una app estática, abre `index.html` en navegador o usa un servidor local:

```bash
python3 -m http.server 8000
```
