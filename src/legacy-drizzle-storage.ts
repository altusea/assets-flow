import {
  Account as IAccount,
  WeeklyRecord as IWeeklyRecord,
  WeeklySummary,
  WeeklyNote as IWeeklyNote,
  AccountWithChanges,
  getRecordDate
} from './types';

// Drizzle 风格的存储服务，使用 localStorage 作为底层存储
// 提供类似 Drizzle ORM 的查询接口和类型安全
export class DrizzleStorageService {
  private static readonly DB_PREFIX = 'drizzle_';

  private static getStorageKey(key: string): string {
    return `${this.DB_PREFIX}${key}`;
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // 账户管理
  static async getAccounts(): Promise<IAccount[]> {
    const data = localStorage.getItem(this.getStorageKey('accounts'));
    return data ? JSON.parse(data) : [];
  }

  static async saveAccount(account: Omit<IAccount, 'id' | 'createdAt'>): Promise<IAccount> {
    const accounts = await this.getAccounts();
    const newAccount: IAccount = {
      ...account,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    };

    accounts.push(newAccount);
    localStorage.setItem(this.getStorageKey('accounts'), JSON.stringify(accounts));
    return newAccount;
  }

  static async updateAccount(id: string, updates: Partial<IAccount>): Promise<IAccount | null> {
    const accounts = await this.getAccounts();
    const index = accounts.findIndex(acc => acc.id === id);

    if (index === -1) return null;

    accounts[index] = { ...accounts[index], ...updates };
    localStorage.setItem(this.getStorageKey('accounts'), JSON.stringify(accounts));
    return accounts[index];
  }

  static async deleteAccount(id: string): Promise<boolean> {
    const accounts = await this.getAccounts();
    const filteredAccounts = accounts.filter(acc => acc.id !== id);

    if (filteredAccounts.length === accounts.length) return false;

    localStorage.setItem(this.getStorageKey('accounts'), JSON.stringify(filteredAccounts));

    // 删除相关的周记录
    await this.deleteWeeklyRecordsByAccount(id);

    return true;
  }

  // 周记录管理
  static async getWeeklyRecords(): Promise<IWeeklyRecord[]> {
    const data = localStorage.getItem(this.getStorageKey('weekly_records'));
    return data ? JSON.parse(data) : [];
  }

  static async saveWeeklyRecord(record: Omit<IWeeklyRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<IWeeklyRecord> {
    const records = await this.getWeeklyRecords();
    const now = new Date().toISOString();

    // 检查是否已存在相同的账户和周记录
    const existingIndex = records.findIndex(
      r => r.accountId === record.accountId && r.recordDate === record.recordDate
    );

    const newRecord: IWeeklyRecord = {
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

    localStorage.setItem(this.getStorageKey('weekly_records'), JSON.stringify(records));
    return newRecord;
  }

  static async deleteWeeklyRecord(id: string): Promise<boolean> {
    const records = await this.getWeeklyRecords();
    const filteredRecords = records.filter(r => r.id !== id);

    if (filteredRecords.length === records.length) return false;

    localStorage.setItem(this.getStorageKey('weekly_records'), JSON.stringify(filteredRecords));
    return true;
  }

  static async deleteWeeklyRecordsByAccount(accountId: string): Promise<void> {
    const records = await this.getWeeklyRecords();
    const filteredRecords = records.filter(r => r.accountId !== accountId);
    localStorage.setItem(this.getStorageKey('weekly_records'), JSON.stringify(filteredRecords));
  }

  // 查询功能
  static async getWeeklySummary(recordDate: string): Promise<WeeklySummary | null> {
    const records = await this.getWeeklyRecords();
    const accounts = await this.getAccounts();

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

  static async getAllWeeklySummaries(): Promise<WeeklySummary[]> {
    const records = await this.getWeeklyRecords();
    const accounts = await this.getAccounts();

    // 按周分组
    const recordsByWeek = records.reduce((acc, record) => {
      if (!acc[record.recordDate]) {
        acc[record.recordDate] = [];
      }
      acc[record.recordDate].push(record);
      return acc;
    }, {} as Record<string, IWeeklyRecord[]>);

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

  static async getRecentWeeks(count: number = 12): Promise<WeeklySummary[]> {
    const summaries = await this.getAllWeeklySummaries();
    return summaries.slice(0, count);
  }

  static async getAccountBalanceHistory(accountId: string, limit: number = 10): Promise<IWeeklyRecord[]> {
    const records = await this.getWeeklyRecords();
    return records
      .filter(r => r.accountId === accountId)
      .sort((a, b) => b.recordDate.localeCompare(a.recordDate))
      .slice(0, limit);
  }

  // 备注管理
  static async getWeeklyNotes(): Promise<IWeeklyNote[]> {
    const data = localStorage.getItem(this.getStorageKey('weekly_notes'));
    return data ? JSON.parse(data) : [];
  }

  static async saveWeeklyNote(note: Omit<IWeeklyNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<IWeeklyNote> {
    const notes = await this.getWeeklyNotes();
    const now = new Date().toISOString();

    // 检查是否已存在相同的周备注
    const existingIndex = notes.findIndex(
      n => n.recordDate === note.recordDate
    );

    const newNote: IWeeklyNote = {
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

    localStorage.setItem(this.getStorageKey('weekly_notes'), JSON.stringify(notes));
    return newNote;
  }

  static async getWeeklyNote(recordDate: string): Promise<IWeeklyNote | null> {
    const notes = await this.getWeeklyNotes();
    return notes.find(n => n.recordDate === recordDate) || null;
  }

  // 变动趋势计算
  static async calculateAccountChanges(accountId: string, currentRecordDate: string): Promise<AccountWithChanges | null> {
    const records = await this.getWeeklyRecords();
    const accounts = await this.getAccounts();
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
    sortedRecords: IWeeklyRecord[],
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

  static async getAllAccountsWithChanges(currentRecordDate: string = getRecordDate()): Promise<AccountWithChanges[]> {
    const accounts = await this.getAccounts();
    const results: AccountWithChanges[] = [];

    for (const account of accounts) {
      const changes = await this.calculateAccountChanges(account.id, currentRecordDate);
      if (changes) {
        results.push(changes);
      }
    }

    return results;
  }

  // 初始化示例数据
  static async initializeSampleData(): Promise<void> {
    const existingAccounts = await this.getAccounts();

    if (existingAccounts.length === 0) {
      // 创建示例账户
      const sampleAccounts: Omit<IAccount, 'id' | 'createdAt'>[] = [
        {
          name: '招商银行储蓄卡',
          type: 'bank',
          description: '工资卡'
        },
        {
          name: '支付宝余额',
          type: 'pay',
          description: '日常消费'
        },
        {
          name: '微信零钱',
          type: 'pay',
          description: '日常消费'
        },
        {
          name: '现金',
          type: 'cash',
          description: '备用现金'
        }
      ];

      const createdAccounts = sampleAccounts.map(account => this.saveAccount(account));
      const accounts = await Promise.all(createdAccounts);

      // 为当前周创建示例记录
      const currentWeek = getRecordDate();
      for (const account of accounts) {
        await this.saveWeeklyRecord({
          accountId: account.id,
          recordDate: currentWeek,
          balance: Math.floor(Math.random() * 10000) + 1000
        });
      }
    }
  }

  // 数据迁移：从 localStorage 迁移到 Drizzle
  static async migrateFromLocalStorage(): Promise<void> {
    // 检查是否已经有数据
    const existingAccounts = await this.getAccounts();
    if (existingAccounts.length > 0) {
      console.log('Drizzle DB already contains data, skipping migration');
      return;
    }

    // 从 localStorage 读取数据
    const storageKeys = {
      ACCOUNTS: 'assets_accounts',
      WEEKLY_RECORDS: 'assets_weekly_records',
      WEEKLY_NOTES: 'assets_weekly_notes'
    };

    try {
      // 迁移账户数据
      const accountsData = localStorage.getItem(storageKeys.ACCOUNTS);
      if (accountsData) {
        const accounts = JSON.parse(accountsData);
        for (const account of accounts) {
          await this.saveAccount({
            name: account.name,
            type: account.type,
            description: account.description
          });
        }
        console.log(`Migrated ${accounts.length} accounts`);
      }

      // 迁移周记录数据
      const recordsData = localStorage.getItem(storageKeys.WEEKLY_RECORDS);
      if (recordsData) {
        const records = JSON.parse(recordsData);
        for (const record of records) {
          await this.saveWeeklyRecord({
            accountId: record.accountId,
            recordDate: record.recordDate,
            balance: record.balance
          });
        }
        console.log(`Migrated ${records.length} weekly records`);
      }

      // 迁移备注数据
      const notesData = localStorage.getItem(storageKeys.WEEKLY_NOTES);
      if (notesData) {
        const notes = JSON.parse(notesData);
        for (const note of notes) {
          await this.saveWeeklyNote({
            recordDate: note.recordDate,
            incomeNote: note.incomeNote,
            expenseNote: note.expenseNote
          });
        }
        console.log(`Migrated ${notes.length} weekly notes`);
      }

      console.log('Migration from localStorage completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }
}