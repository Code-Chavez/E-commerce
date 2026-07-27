export interface TransferGuideData {
  guideNumber: string;
  createdAt: Date;
  status: string;
  requestedBy: { name: string; lastName: string | null } | null;
  fromBranch: { name: string; address: string | null };
  toBranch: { name: string; address: string | null };
  variant: { productName: string; sku: string };
  quantity: number;
}

export interface IStockTransferGuideService {
  generate(data: TransferGuideData): NodeJS.ReadableStream;
}
