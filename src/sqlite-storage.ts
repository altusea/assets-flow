import {
  Account,
  WeeklyRecord,
  WeeklySummary,
  WeeklyNote,
  AccountWithChanges,
  getRecordDate
} from './types';

// 导入 Tauri SQL 插件
import Database from '@tauri-apps/plugin-sql';

export class SQLiteStorageService {
  private static db: Database | null = null;

  // 初始化数据库连接
  private static async getDb(): Promise<Database> {
    if (!this.db) {
      // 使用绝对路径确保数据库文件位置明确
      this.db = await Database.load('sqlite:assets.db');
      await this.initializeTables();
    }
    return this.db;
  }

  // 初始化数据库表
  private static async initializeTables(): Promise<void> {
    const db = await this.getDb();

    // 创建账户表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        createdAt TEXT NOT NULL
      )
    `);

    // 创建周记录表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS weekly_records (
        id TEXT PRIMARY KEY,
        accountId TEXT NOT NULL,
        recordDate TEXT NOT NULL,
        balance REAL NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (accountId) REFERENCES accounts(id) ON DELETE CASCADE
      )
    `);

    // 创建周备注表
    await db.execute(`
      CREATE TABLE IF NOT EXISTS weekly_notes (
        id TEXT PRIMARY KEY,
        recordDate TEXT NOT NULL,
        incomeNote TEXT,
        expenseNote TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // 创建索引
    await db.execute('CREATE INDEX IF NOT EXISTS idx_weekly_records_date ON weekly_records(recordDate)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_weekly_records_account ON weekly_records(accountId)');
    await db.execute('CREATE INDEX IF NOT EXISTS idx_weekly_notes_date ON weekly_notes(recordDate)');
  }

  // 生成唯一 ID
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // 账户管理
  static async getAccounts(): Promise<Account[]> {
    const db = await this.getDb();
    const accounts = await db.select<Account[]>('SELECT * FROM accounts ORDER BY createdAt DESC');
    return accounts || [];
  }

  static async saveAccount(account: Omit<Account, 'id' | 'createdAt'>): Promise<Account> {
    const db = await this.getDb();
    const newAccount: Account = {
      ...account,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    };

    await db.execute(
      'INSERT INTO accounts (id, name, type, description, createdAt) VALUES (?, ?, ?, ?, ?)',
      [newAccount.id, newAccount.name, newAccount.type, newAccount.description || '', newAccount.createdAt]
    );

    return newAccount;
  }

  static async updateAccount(id: string, updates: Partial<Account>): Promise<Account | null> {
    const db = await this.getDb();
    const accounts = await db.select<Account[]>('SELECT * FROM accounts WHERE id = ?', [id]);

    if (accounts.length === 0) return null;

    const updatedAccount = { ...accounts[0], ...updates };

    await db.execute(
      'UPDATE accounts SET name = ?, type = ?, description = ? WHERE id = ?',
      [updatedAccount.name, updatedAccount.type, updatedAccount.description || '', id]
    );

    return updatedAccount;
  }

  static async deleteAccount(id: string): Promise<boolean> {
    const db = await this.getDb();
    const result = await db.execute('DELETE FROM accounts WHERE id = ?', [id]);
    return result.rowsAffected > 0;
  }

  // 周记录管理
  static async getWeeklyRecords(): Promise<WeeklyRecord[]> {
    const db = await this.getDb();
    const records = await db.select<WeeklyRecord[]>('SELECT * FROM weekly_records ORDER BY recordDate DESC, createdAt DESC');
    return records || [];
  }

  static async saveWeeklyRecord(record: Omit<WeeklyRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<WeeklyRecord> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    const newRecord: WeeklyRecord = {
      ...record,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now
    };

    await db.execute(
      'INSERT INTO weekly_records (id, accountId, recordDate, balance, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [newRecord.id, newRecord.accountId, newRecord.recordDate, newRecord.balance, newRecord.createdAt, newRecord.updatedAt]
    );

    return newRecord;
  }

  static async deleteWeeklyRecord(id: string): Promise<boolean> {
    const db = await this.getDb();
    const result = await db.execute('DELETE FROM weekly_records WHERE id = ?', [id]);
    return result.rowsAffected > 0;
  }

  static async deleteWeeklyRecordsByAccount(accountId: string): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM weekly_records WHERE accountId = ?', [accountId]);
  }

  // 查询功能
  static async getWeeklySummary(recordDate: string): Promise<WeeklySummary | null> {
    const db = await this.getDb();

    // 获取该日期所有账户的记录
    const records = await db.select<Array<WeeklyRecord & { accountName: string; accountType: string }>>(`
      SELECT wr.*, a.name as accountName, a.type as accountType
      FROM weekly_records wr
      JOIN accounts a ON wr.accountId = a.id
      WHERE wr.recordDate = ?
    `, [recordDate]);

    if (records.length === 0) return null;

    const totalBalance = records.reduce((sum: number, record) => sum + record.balance, 0);

    return {
      recordDate,
      totalBalance,
      accounts: records.map((record: any) => ({
        accountId: record.accountId,
        accountName: record.accountName,
        accountType: record.accountType,
        balance: record.balance
      }))
    };
  }

  static async getAllWeeklySummaries(): Promise<WeeklySummary[]> {
    const db = await this.getDb();

    const summaries = await db.select<Array<{ recordDate: string; totalBalance: number; accountData: string }>>(`
      SELECT
        recordDate,
        SUM(balance) as totalBalance,
        GROUP_CONCAT(json_object('accountId', accountId, 'accountName', accountName, 'accountType', accountType, 'balance', balance)) as accountData
      FROM (
        SELECT
          wr.recordDate,
          wr.accountId,
          a.name as accountName,
          a.type as accountType,
          wr.balance
        FROM weekly_records wr
        JOIN accounts a ON wr.accountId = a.id
      )
      GROUP BY recordDate
      ORDER BY recordDate DESC
    `);

    return summaries.map((summary: any) => ({
      recordDate: summary.recordDate,
      totalBalance: summary.totalBalance,
      accounts: JSON.parse(`[${summary.accountData}]`)
    }));
  }

  static async getRecentWeeks(count: number = 12): Promise<WeeklySummary[]> {
    const allSummaries = await this.getAllWeeklySummaries();
    return allSummaries.slice(0, count);
  }

  static async getAccountBalanceHistory(accountId: string, limit: number = 10): Promise<WeeklyRecord[]> {
    const db = await this.getDb();
    const records = await db.select<WeeklyRecord[]>(
      'SELECT * FROM weekly_records WHERE accountId = ? ORDER BY recordDate DESC LIMIT ?',
      [accountId, limit]
    );
    return records || [];
  }

  // 备注管理
  static async getWeeklyNotes(): Promise<WeeklyNote[]> {
    const db = await this.getDb();
    const notes = await db.select<WeeklyNote[]>('SELECT * FROM weekly_notes ORDER BY recordDate DESC');
    return notes || [];
  }

  static async saveWeeklyNote(note: Omit<WeeklyNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<WeeklyNote> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    const newNote: WeeklyNote = {
      ...note,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now
    };

    // 检查是否已存在该日期的备注
    const existing = await db.select<WeeklyNote[]>('SELECT * FROM weekly_notes WHERE recordDate = ?', [note.recordDate]);

    if (existing.length > 0) {
      // 更新现有备注
      await db.execute(
        'UPDATE weekly_notes SET incomeNote = ?, expenseNote = ?, updatedAt = ? WHERE recordDate = ?',
        [note.incomeNote || '', note.expenseNote || '', now, note.recordDate]
      );
      return { ...existing[0], ...note, updatedAt: now };
    } else {
      // 插入新备注
      await db.execute(
        'INSERT INTO weekly_notes (id, recordDate, incomeNote, expenseNote, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
        [newNote.id, newNote.recordDate, newNote.incomeNote || '', newNote.expenseNote || '', newNote.createdAt, newNote.updatedAt]
      );
      return newNote;
    }
  }

  static async getWeeklyNote(recordDate: string): Promise<WeeklyNote | null> {
    const db = await this.getDb();
    const notes = await db.select<WeeklyNote[]>('SELECT * FROM weekly_notes WHERE recordDate = ?', [recordDate]);
    return notes.length > 0 ? notes[0] : null;
  }

  // 变动趋势计算
  static async calculateAccountChanges(accountId: string, currentRecordDate: string): Promise<AccountWithChanges | null> {
    const db = await this.getDb();

    // 获取账户信息
    const accounts = await db.select<Account[]>('SELECT * FROM accounts WHERE id = ?', [accountId]);
    if (accounts.length === 0) return null;

    const account = accounts[0];

    // 获取当前余额
    const currentRecords = await db.select<WeeklyRecord[]>(
      'SELECT * FROM weekly_records WHERE accountId = ? AND recordDate = ?',
      [accountId, currentRecordDate]
    );

    if (currentRecords.length === 0) return null;
    const currentBalance = currentRecords[0].balance;

    // 计算周变动（与上一周比较）
    const previousWeek = await db.select<WeeklyRecord[]>(
      'SELECT * FROM weekly_records WHERE accountId = ? AND recordDate < ? ORDER BY recordDate DESC LIMIT 1',
      [accountId, currentRecordDate]
    );
    const weeklyChange = previousWeek.length > 0 ? currentBalance - previousWeek[0].balance : 0;

    // 计算月度变动（与4周前比较）
    const fourWeeksAgo = await db.select<WeeklyRecord[]>(
      'SELECT * FROM weekly_records WHERE accountId = ? AND recordDate < ? ORDER BY recordDate DESC LIMIT 1 OFFSET 3',
      [accountId, currentRecordDate]
    );
    const monthlyChange = fourWeeksAgo.length > 0 ? currentBalance - fourWeeksAgo[0].balance : 0;

    // 计算季度变动（与12周前比较）
    const twelveWeeksAgo = await db.select<WeeklyRecord[]>(
      'SELECT * FROM weekly_records WHERE accountId = ? AND recordDate < ? ORDER BY recordDate DESC LIMIT 1 OFFSET 11',
      [accountId, currentRecordDate]
    );
    const quarterlyChange = twelveWeeksAgo.length > 0 ? currentBalance - twelveWeeksAgo[0].balance : 0;

    return {
      accountId: account.id,
      accountName: account.name,
      accountType: account.type,
      currentBalance,
      weeklyChange,
      monthlyChange,
      quarterlyChange
    };
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
    const accounts = await this.getAccounts();
    if (accounts.length > 0) return; // 已有数据则不初始化

    // 创建示例账户
    const sampleAccounts = [
      { name: '招商银行', type: 'bank' as const, description: '工资卡' },
      { name: '支付宝', type: 'pay' as const, description: '日常消费' },
      { name: '微信钱包', type: 'pay' as const, description: '零钱' },
      { name: '现金', type: 'cash' as const, description: '备用现金' }
    ];

    for (const account of sampleAccounts) {
      await this.saveAccount(account);
    }
  }

  // 数据迁移 - 从 localStorage 迁移到 SQLite
  static async migrateFromLocalStorage(): Promise<void> {
    try {
      console.log('Starting migration from localStorage to SQLite...');

      // 检查 localStorage 是否有数据
      const hasAccounts = localStorage.getItem('assets_accounts');
      const hasRecords = localStorage.getItem('assets_weekly_records');
      const hasNotes = localStorage.getItem('assets_weekly_notes');

      if (!hasAccounts && !hasRecords && !hasNotes) {
        console.log('No localStorage data found to migrate');
        return;
      }

      // 迁移账户数据
      if (hasAccounts) {
        const accounts: Account[] = JSON.parse(hasAccounts);
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
      if (hasRecords) {
        const records: WeeklyRecord[] = JSON.parse(hasRecords);
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
      if (hasNotes) {
        const notes: WeeklyNote[] = JSON.parse(hasNotes);
        for (const note of notes) {
          await this.saveWeeklyNote({
            recordDate: note.recordDate,
            incomeNote: note.incomeNote,
            expenseNote: note.expenseNote
          });
        }
        console.log(`Migrated ${notes.length} weekly notes`);
      }

      console.log('Migration to SQLite completed successfully');
    } catch (error) {
      console.error('Migration to SQLite failed:', error);
      throw error;
    }
  }

  // 获取数据库文件路径（用于调试）
  static async getDatabasePath(): Promise<string> {
    await this.getDb();
    // 在 Tauri 中，数据库文件通常存储在应用数据目录
    // 具体路径取决于操作系统和 Tauri 配置
    return '数据库文件存储在 Tauri 应用数据目录中';
  }
}