export interface ShippingLabelData {
  recipientName: string;
  fullAddress: string;
  district: string;
  trackingCode: string; // Unique tracking/shipping code
}

export interface IShippingLabelService {
  generateLabelPdfStream(data: ShippingLabelData): Promise<NodeJS.ReadableStream>;
}
