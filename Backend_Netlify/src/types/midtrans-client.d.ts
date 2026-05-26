declare module 'midtrans-client' {
  interface SnapConfig {
    isProduction: boolean;
    serverKey: string | undefined;
    clientKey: string | undefined;
  }

  interface TransactionDetails {
    order_id: string;
    gross_amount: number;
  }

  interface ItemDetail {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }

  interface CreateTransactionParam {
    transaction_details: TransactionDetails;
    customer_details?: Record<string, unknown>;
    item_details?: ItemDetail[];
  }

  interface TransactionResult {
    token: string;
    redirect_url: string;
  }

  class Snap {
    constructor(config: SnapConfig);
    createTransaction(param: CreateTransactionParam): Promise<TransactionResult>;
  }

  export { Snap };
}
