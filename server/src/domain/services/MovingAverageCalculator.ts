export class MovingAverageCalculator {
  /**
   * Calculates the moving average demand per month.
   * @param totalSales The sum of sales quantities in the period.
   * @param months The number of months in the period.
   */
  static calculate(totalSales: number, months: number): number {
    if (months <= 0) {
      return 0;
    }
    const average = totalSales / months;
    return Math.round(average * 100) / 100;
  }
}
