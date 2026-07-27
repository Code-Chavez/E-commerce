export interface DemandForecastItem {
  categoryName: string;
  size: string;
  projectedDemand: number;
}

export interface DemandForecastResponse {
  success: boolean;
  data: DemandForecastItem[];
}

export interface RestockSuggestionItem {
  variantId: number;
  suggestedQty: number;
  currentStock: number;
}

export interface RestockSuggestionsResponse {
  success: boolean;
  data: RestockSuggestionItem[];
}
