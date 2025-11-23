export interface Account {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'pay' | 'stock' | 'other';
  description?: string;
  createdAt: string;
}

export interface WeeklyRecord {
  id: string;
  accountId: string;
  recordDate: string; // 周六日期，作为记录日期
  balance: number; // 余额（人民币，单位：元）
  createdAt: string;
  updatedAt: string;
}

export interface WeeklySummary {
  recordDate: string;
  totalBalance: number;
  accounts: {
    accountId: string;
    accountName: string;
    accountType: string;
    balance: number;
  }[];
}

export interface WeeklyNote {
  id: string;
  recordDate: string;
  incomeNote?: string; // 收入备注
  expenseNote?: string; // 支出备注
  createdAt: string;
  updatedAt: string;
}

export interface AccountWithChanges {
  accountId: string;
  accountName: string;
  accountType: string;
  currentBalance: number;
  weeklyChange: number; // 周变动
  monthlyChange: number; // 4/5周变动
  quarterlyChange: number; // 季度变动
}

// 获取当前周的记录日期（周六）
export function getRecordDate(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  // 调整到周六 (day=6)
  const diff = d.getDate() - day + 6;
  const saturday = new Date(d.setDate(diff));
  return saturday.toISOString().split('T')[0];
}

// 获取周数
export function getWeekNumber(date: Date = new Date()): number {
  const d = new Date(date);
  const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
  const pastDaysOfYear = (d.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// 格式化金额
export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

// 格式化日期
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

// 获取账户类型的显示名称
export function getAccountTypeLabel(type: Account['type']): string {
  const labels = {
    bank: '银行卡',
    cash: '现金',
    pay: '电子支付',
    stock: '股票',
    other: '其他'
  };
  return labels[type];
}
