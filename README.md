# Auditoría Almacenamiento • CIAL Alimentos CD San Jorge

Sistema web de visualización de racks, pasillos de almacenamiento y toma de inventario en altura para **CIAL Alimentos / San Jorge**.

Diseñado para reemplazar planillas Excel complejas por una aplicación interactiva, ultrarrápida y optimizada para operar tanto en terreno (tablets y smartphones industriales) como en estaciones de control.

## 🚀 Características

- **Visualizador de 29 Racks**: Mapa completo de la bodega con sus 29 estanterías y hasta 44 módulos por rack.
- **Detección Visual de Vacíos**: Identificación inmediata de espacios vacíos con fondo negro y etiquetas claras.
- **Formato Auditoría Oficial (Estilo Excel)**: Grilla idéntica a la planilla de auditoría, con módulos por fila y niveles 6 a 1 por columna.
- **Elevación Frontal 2D (Muro)**: Visualización panorámica de estanterías.
- **Pasillo Doble Enfrentado**: Comparación simultánea de cara izquierda y cara derecha mientras se camina por el corredor central.
- **Carga Directa de Data SAP**: Copiar y pegar directamente columnas de SAP WM/WMS (Material, Centro, Almacén, Lote, Ubicación, Stock disponible, etc.) con procesamiento en milisegundos.
- **Subida de Archivos Excel**: Soporte para archivos `.xlsx`, `.xlsm` y `.csv`.
- **Modo Auditoría Físico vs Sistémico**: Marcado en vivo de Conforme, Falta Física, Sobra Física o Lote Distinto.
- **Generador Automático de Informes**: Redacta el correo formal CIAL listo para pegar en Outlook con tablas HTML estilizadas y exportación a Excel.

## 🛠️ Tecnologías

- **React 19 + TypeScript + Vite**
- **Tailwind CSS v4**
- **Lucide React**
- **SheetJS (xlsx)**

## 📦 Scripts

```bash
# Desarrollo local
npm run dev

# Compilación para producción
npm run build

# Vista previa de producción
npm run preview
```

---
Desarrollado para el ecosistema Nexus • CIAL Alimentos 2026.
