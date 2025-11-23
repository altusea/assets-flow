import { Account, WeeklyRecord, WeeklySummary, WeeklyNote, AccountWithChanges, getRecordDate } from './types';

const STORAGE_KEYS = {
  ACCOUNTS: 'assets_accounts',
  WEEKLY_RECORDS: 'assets_weekly_records',
  WEEKLY_NOTES: 'assets_weekly_notes'
};

export class StorageService {
  // 账户管理
  static getAccounts(): Account[] {
    const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    return data ? JSON.parse(data) : [];
  }

  static saveAccount(account: Omit<Account, 'id' | 'createdAt'>): Account {
    const accounts = this.getAccounts();
    const newAccount: Account = {
      ...account,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    };

    accounts.push(newAccount);
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    return newAccount;
  }

  static updateAccount(id: string, updates: Partial<Account>): Account | null {
    const accounts = this.getAccounts();
    const index = accounts.findIndex(acc => acc.id === id);

    if (index === -1) return null;

    accounts[index] = { ...accounts[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    return accounts[index];
  }

  static deleteAccount(id: string): boolean {
    const accounts = this.getAccounts();
    const filteredAccounts = accounts.filter(acc => acc.id !== id);

    if (filteredAccounts.length === accounts.length) return false;

    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(filteredAccounts));

    // 删除相关的周记录
    this.deleteWeeklyRecordsByAccount(id);

    return true;
  }

  // 周记录管理
  static getWeeklyRecords(): WeeklyRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.WEEKLY_RECORDS);
    return data ? JSON.parse(data) : [];
  }

  static saveWeeklyRecord(record: Omit<WeeklyRecord, 'id' | 'createdAt' | 'updatedAt'>): WeeklyRecord {
    const records = this.getWeeklyRecords();
    const now = new Date().toISOString();

    // 检查是否已存在相同的账户和周记录
    const existingIndex = records.findIndex(
      r => r.accountId === record.accountId && r.recordDate === record.recordDate
    );

    const newRecord: WeeklyRecord = {
      ...record,
      id: existingIndex >= 0 ? records[existingIndex].id : this.generateId(),
      createdAt: existingIndex >= 0 ? records[existingIndex].createdAt : now,
      updatedAt: now
    };

    if (existingIndex >= 0) {
      records[existingIndex] = newRecord;
    } else {
      records.push(newRecord);
    }

    localStorage.setItem(STORAGE_KEYS.WEEKLY_RECORDS, JSON.stringify(records));
    return newRecord;
  }

  static deleteWeeklyRecord(id: string): boolean {
    const records = this.getWeeklyRecords();
    const filteredRecords = records.filter(r => r.id !== id);

    if (filteredRecords.length === records.length) return false;

    localStorage.setItem(STORAGE_KEYS.WEEKLY_RECORDS, JSON.stringify(filteredRecords));
    return true;
  }

  static deleteWeeklyRecordsByAccount(accountId: string): void {
    const records = this.getWeeklyRecords();
    const filteredRecords = records.filter(r => r.accountId !== accountId);
    localStorage.setItem(STORAGE_KEYS.WEEKLY_RECORDS, JSON.stringify(filteredRecords));
  }

  // 查询功能
  static getWeeklySummary(recordDate: string): WeeklySummary | null {
    const records = this.getWeeklyRecords();
    const accounts = this.getAccounts();

    const weekRecords = records.filter(r => r.recordDate === recordDate);

    if (weekRecords.length === 0) return null;

    const totalBalance = weekRecords.reduce((sum, record) => sum + record.balance, 0);

    const accountDetails = weekRecords.map(record => {
      const account = accounts.find(acc => acc.id === record.accountId);
      return {
        accountId: record.accountId,
        accountName: account?.name || '未知账户',
        accountType: account?.type || 'other',
        balance: record.balance
      };
    });

    return {
      recordDate,
      totalBalance,
      accounts: accountDetails
    };
  }

  static getAllWeeklySummaries(): WeeklySummary[] {
    const records = this.getWeeklyRecords();
    const accounts = this.getAccounts();

    // 按周分组
    const recordsByWeek = records.reduce((acc, record) => {
      if (!acc[record.recordDate]) {
        acc[record.recordDate] = [];
      }
      acc[record.recordDate].push(record);
      return acc;
    }, {} as Record<string, WeeklyRecord[]>);

    // 生成每周汇总
    return Object.entries(recordsByWeek)
      .map(([recordDate, weekRecords]) => {
        const totalBalance = weekRecords.reduce((sum, record) => sum + record.balance, 0);

        const accountDetails = weekRecords.map(record => {
          const account = accounts.find(acc => acc.id === record.accountId);
          return {
            accountId: record.accountId,
            accountName: account?.name || '未知账户',
            accountType: account?.type || 'other',
            balance: record.balance
          };
        });

        return {
          recordDate,
          totalBalance,
          accounts: accountDetails
        };
      })
      .sort((a, b) => b.recordDate.localeCompare(a.recordDate)); // 按日期降序
  }

  static getRecentWeeks(count: number = 12): WeeklySummary[] {
    return this.getAllWeeklySummaries().slice(0, count);
  }

  static getAccountBalanceHistory(accountId: string, limit: number = 10): WeeklyRecord[] {
    const records = this.getWeeklyRecords();
    return records
      .filter(r => r.accountId === accountId)
      .sort((a, b) => b.recordDate.localeCompare(a.recordDate))
      .slice(0, limit);
  }

  // 备注管理
  static getWeeklyNotes(): WeeklyNote[] {
    const data = localStorage.getItem(STORAGE_KEYS.WEEKLY_NOTES);
    return data ? JSON.parse(data) : [];
  }

  static saveWeeklyNote(note: Omit<WeeklyNote, 'id' | 'createdAt' | 'updatedAt'>): WeeklyNote {
    const notes = this.getWeeklyNotes();
    const now = new Date().toISOString();

    // 检查是否已存在相同的周备注
    const existingIndex = notes.findIndex(
      n => n.recordDate === note.recordDate
    );

    const newNote: WeeklyNote = {
      ...note,
      id: existingIndex >= 0 ? notes[existingIndex].id : this.generateId(),
      createdAt: existingIndex >= 0 ? notes[existingIndex].createdAt : now,
      updatedAt: now
    };

    if (existingIndex >= 0) {
      notes[existingIndex] = newNote;
    } else {
      notes.push(newNote);
    }

    localStorage.setItem(STORAGE_KEYS.WEEKLY_NOTES, JSON.stringify(notes));
    return newNote;
  }

  static getWeeklyNote(recordDate: string): WeeklyNote | null {
    const notes = this.getWeeklyNotes();
    return notes.find(n => n.recordDate === recordDate) || null;
  }

  // 变动趋势计算
  static calculateAccountChanges(accountId: string, currentRecordDate: string): AccountWithChanges | null {
    const records = this.getWeeklyRecords();
    const accounts = this.getAccounts();
    const account = accounts.find(a => a.id === accountId);

    if (!account) return null;

    // 按周排序
    const sortedRecords = records
      .filter(r => r.accountId === accountId)
      .sort((a, b) => a.recordDate.localeCompare(b.recordDate));

    if (sortedRecords.length === 0) return null;

    // 当前余额
    const currentRecord = sortedRecords.find(r => r.recordDate === currentRecordDate) ||
                        sortedRecords[sortedRecords.length - 1];
    const currentBalance = currentRecord.balance;

    // 计算各时期变动
    const weeklyChange = this.calculateChangeForPeriod(sortedRecords, currentRecordDate, 1);
    const monthlyChange = this.calculateChangeForPeriod(sortedRecords, currentRecordDate, 4); // 4周
    const quarterlyChange = this.calculateChangeForPeriod(sortedRecords, currentRecordDate, 12); // 12周约3个月

    return {
      accountId,
      accountName: account.name,
      accountType: account.type,
      currentBalance,
      weeklyChange,
      monthlyChange,
      quarterlyChange
    };
  }

  private static calculateChangeForPeriod(
    sortedRecords: WeeklyRecord[],
    currentRecordDate: string,
    weeksBack: number
  ): number {
    const currentRecord = sortedRecords.find(r => r.recordDate === currentRecordDate) ||
                         sortedRecords[sortedRecords.length - 1];

    if (!currentRecord) return 0;

    const currentDate = new Date(currentRecord.recordDate);
    const targetDate = new Date(currentDate);
    targetDate.setDate(targetDate.getDate() - (weeksBack * 7));

    // 找到目标时期最接近的记录
    const targetRecord = sortedRecords
      .filter(r => new Date(r.recordDate) <= targetDate)
      .sort((a, b) => b.recordDate.localeCompare(a.recordDate))[0];

    if (!targetRecord || targetRecord.recordDate === currentRecord.recordDate) return 0;

    return currentRecord.balance - targetRecord.balance;
  }

  static getAllAccountsWithChanges(currentRecordDate: string = getRecordDate()): AccountWithChanges[] {
    const accounts = this.getAccounts();
    return accounts
      .map(account => this.calculateAccountChanges(account.id, currentRecordDate))
      .filter((item): item is AccountWithChanges => item !== null);
  }

  // 工具方法
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // 初始化一些示例数据
  static initializeSampleData(): void {
    const existingAccounts = this.getAccounts();

    if (existingAccounts.length === 0) {
      // 创建示例账户
      const sampleAccounts: Omit<Account, 'id' | 'createdAt'>[] = [
        {
          name: '招商银行储蓄卡',
          type: 'bank',
          description: '工资卡'
        },
        {
          name: '支付宝余额',
          type: 'bank',
          description: '日常消费'
        },
        {
          name: '微信零钱',
          type: 'bank',
          description: '日常消费'
        },
        {
          name: '现金',
          type: 'cash',
          description: '备用现金'
        }
      ];

      const createdAccounts = sampleAccounts.map(account => this.saveAccount(account));

      // 为当前周创建示例记录
      const currentWeek = getRecordDate();
      createdAccounts.forEach(account => {
        this.saveWeeklyRecord({
          accountId: account.id,
          recordDate: currentWeek,
          balance: Math.floor(Math.random() * 10000) + 1000
        });
      });
    }
  }
}