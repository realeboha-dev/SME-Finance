// src/services/transactionService.ts
import type { Transaction, BusinessStats } from '../types/schema';

export const TransactionService = {
  /**
   * Calculates dashboard metrics from a flat transaction list.
   *
   * Transaction types in play:
   *   'sale'    – completed income (cash in)
   *   'debt'    – outstanding credit; status 'Pending' until paid
   *   'expense' – cash out. Category 'Stock' = inventory purchases.
   *   'cogs'    – cost of goods sold. NOT a cash outflow. Auto-created
   *               when a product is sold, using buyingPrice × qty.
   *
   * Three profit numbers, all meaningful, none double-counting:
   *   cashProfit  = revenue − all expenses          (did I make cash?)
   *   grossProfit = revenue − COGS                  (margin on what I sell)
   *   netProfit   = revenue − COGS − operatingExp   (real bottom line)
   */
  calculateDashboardStats: (transactions: Transaction[]): BusinessStats => {
    // ---- bucket by role ----
    const sales = transactions.filter(
      (t) => t.status === 'Completed' && t.type !== 'expense' && t.type !== 'cogs'
    );
    const pending = transactions.filter((t) => t.status === 'Pending');
    const expenses = transactions.filter((t) => t.type === 'expense');
    const cogs = transactions.filter((t) => t.type === 'cogs');

    // ---- revenue ----
    const totalRevenue = sales.reduce((sum, t) => sum + t.amount, 0);

    const mpesaVolume = sales
      .filter((t) => t.method === 'M-Pesa')
      .reduce((sum, t) => sum + t.amount, 0);

    const ecocashVolume = sales
      .filter((t) => t.method === 'EcoCash')
      .reduce((sum, t) => sum + t.amount, 0);

    // ---- outstanding debt (use balance, not gross) ----
    const totalPending = pending.reduce(
      (sum, t) => sum + (t.amount - (t.amountPaid ?? 0)),
      0
    );

    // ---- expenses split ----
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

    const stockPurchases = expenses
      .filter((t) => t.category === 'Stock')
      .reduce((sum, t) => sum + t.amount, 0);

    const operatingExpenses = totalExpenses - stockPurchases;

    // ---- COGS ----
    const totalCogs = cogs.reduce((sum, t) => sum + t.amount, 0);

    return {
      totalRevenue,
      mpesaVolume,
      ecocashVolume,
      totalPending,
      revenueChange: '+12%', // TODO: compare against previous month

      totalExpenses,
      stockPurchases,
      operatingExpenses,
      totalCogs,

      cashProfit: totalRevenue - totalExpenses,
      grossProfit: totalRevenue - totalCogs,
      netProfit: totalRevenue - totalCogs - operatingExpenses,
    };
  },

  /**
   * Mock server synchronization to demonstrate async handling in portfolio.
   */
  async syncWithServer(transaction: Transaction): Promise<boolean> {
    return new Promise((resolve) => {
      console.warn('Syncing Khotso-Pay transaction...', transaction.id);
      setTimeout(() => resolve(true), 1000);
    });
  },
};