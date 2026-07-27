export function normalizeAttributesJson(attributesJson: any): Record<string, string> {
  const flatAttributes: Record<string, string> = {};
  
  if (attributesJson && typeof attributesJson === 'object') {
    Object.entries(attributesJson).forEach(([key, val]) => {
      if (val && typeof val === 'object' && 'value' in (val as any)) {
        // Formato enriquecido: { "1": { name: "Color", value: "Negro" } }
        const name = (val as any).name || key;
        flatAttributes[name.toLowerCase()] = String((val as any).value);
      } else {
        // Formato simple: { "color": "Blanco", "talla": "40" }
        flatAttributes[key.toLowerCase()] = String(val);
      }
    });
  }
  
  return flatAttributes;
}
