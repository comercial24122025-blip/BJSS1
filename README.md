# Salesforce App: Gestión y Seguimiento de Cuentas Nuevas y Existentes

Este repositorio incluye una base de **metadata Salesforce (SFDX)** para gestionar pipeline comercial, legal, DD, integración y go-live.

## Incluye
- Aplicación Lightning: `Account_Pipeline_Management`
- Objeto principal: `Pipeline_Deal__c`
- Objeto de metas KPI: `KPI_Target__c`
- Catálogo KPI como Custom Metadata Type: `KPI_Catalog`
- Tab para navegación de objetos
- Permiso base para usuarios de negocio (`SalesOps_Manager`)

## Cobertura funcional implementada

### 1) Gestión de deals/cuentas (nuevas y existentes)
Se modelaron campos para:
- Deal, Type, Market, Platform
- Signing ETA / Year / Month
- Deal Value (EUR)
- Legal, DD, Integration, Go Live status
- New Traffic, Comments, Action Items, Source
- Stage y banderas de avance por etapa
- Información operativa: Jira, DD ticket, URL, Skype, Handover, Brands, etc.

### 2) KPI
Se soportan dimensiones para análisis:
- Year
- Market
- Type
- Platform
- New Traffic

### 3) Targets
En `KPI_Target__c`:
- New Signed
- Integrations
- DD Pipeline
- New Go Live
- Total Go Live

### 4) Pipeline y seguimiento operativo
En `Pipeline_Deal__c` se incluyeron los campos del layout de pipeline:
- mo, Evo, Client, type, Market, Platform
- Status, Agreement, Integration, DD
- Signed ETA, Live since, Last follow up
- Handover, Deal Value, Brands, Entity & Company Info
- URL, Jira, DD TKT, Skype, Integration email, Updates

### 5) KPI Catalogue
Se modela `KPI_Catalog__mdt` para mantener:
- KPI Block
- KPI Name
- Definition / Formula
- Stage
- Frequency
- Notes

## Despliegue

```bash
sf org login web --alias devhub
sf org login web --alias target
sf project deploy start --target-org target --source-dir force-app
```

## Próximos pasos recomendados
1. Crear report types y dashboards por Stage (Legal, DD, Integration, Go Live).
2. Agregar Flow para calcular aging (ej. DD > 30 días).
3. Configurar validaciones para transición de stage.
4. Conectar Revenue para KPI de Existing Client Growth (€).
