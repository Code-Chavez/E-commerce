import { useCallback } from 'react';
import type { ProfitabilityReportResponse, GroupByOption } from '../../../types/profitability';
import toast from 'react-hot-toast';

export const useExportCsv = () => {
  const exportToCsv = useCallback((data: ProfitabilityReportResponse['data'] | null, groupBy: GroupByOption) => {
    if (!data || data.items.length === 0) {
      toast.error('No hay datos para exportar.');
      return;
    }

    try {
      const groupByLabel = groupBy === 'brand' ? 'Marca' : 'Categoría';
      const headers = [groupByLabel, 'Cant. Vendida', 'Ventas Totales', 'Costo Total', 'Utilidad Bruta', 'Margen %'];
      
      const rows = data.items.map((item: any) => [
        item.name,
        item.totalQuantity.toString(),
        item.totalRevenue.toFixed(2),
        item.totalCost.toFixed(2),
        item.grossProfit.toFixed(2),
        `${item.profitMarginPercentage.toFixed(2)}%`
      ]);

      if (data.totals) {
        rows.push([
          'TOTALES',
          data.totals.totalQuantity.toString(),
          data.totals.totalRevenue.toFixed(2),
          data.totals.totalCost.toFixed(2),
          data.totals.grossProfit.toFixed(2),
          `${data.totals.profitMarginPercentage.toFixed(2)}%`
        ]);
      }

      const csvContent = [
        headers.join(','),
        ...rows.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.setAttribute('download', `reporte-rentabilidad-${groupBy}-${new Date().getTime()}.csv`);
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast.success('Reporte exportado exitosamente.');
    } catch (error) {
      toast.error('Ocurrió un error al exportar el archivo CSV.');
      console.error(error);
    }
  }, []);

  return { exportToCsv };
};
