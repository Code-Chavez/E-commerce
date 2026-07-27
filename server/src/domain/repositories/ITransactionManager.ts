export interface ITransactionManager {
  run<T>(callback: (tx: any) => Promise<T>): Promise<T>;
}
