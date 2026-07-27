import type { LowRotationItem } from '../types/lowRotation.types';

export const exportLowRotationToCSV = (items: LowRotationItem[], days: number): void => {
  const headers = [
    'SKU',
    'Producto',
    'Atributos',
    'Dias sin Venta',
    'Fecha de Ultima Salida',
    'Stock Actual'
  ];

  const escapeCSVValue = (val: any): string => {
    if (val === null || val === undefined) return '';
    const stringVal = String(val);
    if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
      return `"${stringVal.replace(/"/g, '""')}"`;
    }
    return stringVal;
  };

  const rows = items.map((item) => {
    const formattedAttributes = Object.entries(item.attributes)
      .map(([key, val]) => `${key}: ${val}`)
      .join(' | ');

    const formattedDate = item.lastMovementDate
      ? new Date(item.lastMovementDate).toLocaleDateString('es-ES')
      : 'Sin registro (Novedad)';

    return [
      escapeCSVValue(item.sku || '-'),
      escapeCSVValue(item.productName),
      escapeCSVValue(formattedAttributes || '-'),
      escapeCSVValue(item.daysWithoutMovement),
      escapeCSVValue(formattedDate),
      escapeCSVValue(item.currentStock)
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Prepend UTF-8 BOM so Excel opens it with correct encoding (e.g. accents and symbols)
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `reporte_baja_rotacion_${days}_dias.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

import type { RestockSuggestionItem } from '../types/forecast.types';

export const exportRestockSuggestionsToCSV = (items: RestockSuggestionItem[], months: number): void => {
  const headers = [
    'ID Variante',
    'Stock Actual',
    'Cantidad Sugerida'
  ];

  const escapeCSVValue = (val: any): string => {
    if (val === null || val === undefined) return '';
    const stringVal = String(val);
    if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
      return `"${stringVal.replace(/"/g, '""')}"`;
    }
    return stringVal;
  };

  const rows = items.map((item) => {
    return [
      escapeCSVValue(item.variantId),
      escapeCSVValue(item.currentStock),
      escapeCSVValue(item.suggestedQty)
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `sugerencias_abastecimiento_${months}_meses.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
