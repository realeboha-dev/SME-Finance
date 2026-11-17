import type { Timestamp } from 'firebase/firestore';

export type PaymentMethod = 'M-Pesa' | 'EcoCash' | 'Cash' | 'Card';
export type TransactionStatus = 'Completed' | 'Pending' | 'Failed';

/**
 * 'sale'    – money in from a completed sale
 * 'debt'    – money owed (status 'Pending'); becomes 'sale' when fully paid
 * 'expense' – money out. Category 'Stock' means inventory purchases (cash outflow).
 * 'cogs'    – cost of goods sold. Not a cash outflow. Created automatically
 *             when a product sale/debt is recorded, using buyingPrice × qty.
 *             Used to compute gross margin and true net profit.
 */
export type TransactionType = 'sale' | 'debt' | 'expense' | 'cogs';
export type ExpenseCategory = 'Rent' | 'Utilities' | 'Salaries' | 'Transport' | 'Stock' | 'Other';

export interface Transaction {
  id: string;
  name: string;
  items?: string;
  amount: number;
  method: PaymentMethod;
  status: TransactionStatus;
  date: string;
  time: string;
  userId?: string;
  createdAt?: Timestamp | null;

  // --- income vs cost vs expense ---
  /** 'sale' | 'debt' | 'expense' | 'cogs'. Older records without this field are treated as 'sale' or 'debt' based on status. */
  type?: TransactionType;
  /** Only set when type === 'expense'. One of the fixed expense categories. */
  category?: ExpenseCategory | string;

  // --- Debt-specific fields (only populated when status === 'Pending') ---
  customerPhone?: string;
  customerEmail?: string;
  dueDate?: string;
  amountPaid?: number;
  remindersSent?: number;
  lastReminderAt?: string;
  notes?: string;
}

export interface BusinessStats {
  totalRevenue: number;
  mpesaVolume: number;
  ecocashVolume: number;
  totalPending: number;
  revenueChange: string;

  // --- expense breakdown ---
  /** All type === 'expense' rows. Includes Stock purchases. */
  totalExpenses: number;
  /** Subset of totalExpenses where category === 'Stock'. Cash that bought inventory. */
  stockPurchases: number;
  /** totalExpenses − stockPurchases. Rent, utilities, etc. */
  operatingExpenses: number;
  /** Sum of type === 'cogs' rows. Cost of what was sold, not a cash flow. */
  totalCogs: number;

  // --- the three profit numbers ---
  /** revenue − totalExpenses. "Did I end the day with more cash?" */
  cashProfit: number;
  /** revenue − totalCogs. Margin before overheads. */
  grossProfit: number;
  /** revenue − totalCogs − operatingExpenses. The real bottom line. */
  netProfit: number;
}