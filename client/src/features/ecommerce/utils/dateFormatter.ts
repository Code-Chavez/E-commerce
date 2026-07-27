/**
 * Formatea una fecha o cadena ISO al formato estándar "dd/MM/yyyy HH:mm".
 * Ejemplo: "2026-06-25T15:45:00.000Z" -> "25/06/2026 15:45"
 */
export const formatTimelineDate = (dateString?: string | Date): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
};
