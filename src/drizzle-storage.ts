import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { eq, and, desc } from 'drizzle-orm';
import { schema } from './drizzle-schema';
import type { Account, WeeklyRecord, WeeklySummary, WeeklyNote, AccountWithChanges } from './types';
import { getRecordDate } from './types';
import Database from '@tauri-apps/plugin-sql';

// 创建 Drizzle 实例，使用 Tauri SQL 插件作为后端
export class DrizzleStorageService {
  private static db: any = null;
  private static sqliteDb: Database | null = null;

  // 初始化数据库连接
  private static async getDb() {
    if (!this.db) {
      // 初始化 Tauri SQL 插件
      this.sqliteDb = await Database.load('sqlite:assets.db');

      // 创建 Drizzle 实例，使用 SQL 代理驱动
      this.db = drizzle(
        async (sql: string, params: any[], method: 'run' | 'all' | 'get' | 'values') => {
          if (!this.sqliteDb) {
            throw new Error('Database not initialized');
          }

          try {
            let results: any[] = [];

            // 根据查询类型执行不同的操作
            if (method === 'all' || method === 'get' || sql.trim().toLowerCase().startsWith('select')) {
              results = await this.sqliteDb.select(sql, params);
            } else {
              const result = await this.sqliteDb.execute(sql, params);
              results = [result];
            }

            return { rows: results };
          } catch (error) {
            console.error('Database query error:', error);
            throw error;
          }
        },
        { schema, logger: false }
      );

      // 初始化数据库表
      await this.initializeTables();
    }

    return this.db;
  }

  // 初始化数据库表
  private static async initializeTables(): Promise<void> {
    if (!this.sqliteDb) return;

    // 创建账户表
    await this.sqliteDb.execute(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        createdAt TEXT NOT NULL
      )
    `);

    // 创建周记录表
    await this.sqliteDb.execute(`
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
    await this.sqliteDb.execute(`
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
    await this.sqliteDb.execute('CREATE INDEX IF NOT EXISTS idx_weekly_records_date ON weekly_records(recordDate)');
    await this.sqliteDb.execute('CREATE INDEX IF NOT EXISTS idx_weekly_records_account ON weekly_records(accountId)');
    await this.sqliteDb.execute('CREATE INDEX IF NOT EXISTS idx_weekly_notes_date ON weekly_notes(recordDate)');
  }

  // 生成唯一 ID
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // 账户管理
  static async getAccounts(): Promise<Account[]> {
    const db = await this.getDb();
    const result = await db.select().from(schema.accounts).orderBy(desc(schema.accounts.createdAt));
    return result;
  }

  static async saveAccount(account: Omit<Account, 'id' | 'createdAt'>): Promise<Account> {
    const db = await this.getDb();
    const newAccount: Account = {
      ...account,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    };

    await db.insert(schema.accounts).values(newAccount);
    return newAccount;
  }

  static async updateAccount(id: string, updates: Partial<Account>): Promise<Account | null> {
    const db = await this.getDb();
    const existing = await db.select().from(schema.accounts).where(eq(schema.accounts.id, id));

    if (existing.length === 0) return null;

    const updatedAccount = { ...existing[0], ...updates };
    await db.update(schema.accounts).set(updates).where(eq(schema.accounts.id, id));

    return updatedAccount;
  }

  static async deleteAccount(id: string): Promise<boolean> {
    const db = await this.getDb();
    const result = await db.delete(schema.accounts).where(eq(schema.accounts.id, id));
    return result.rowsAffected > 0;
  }

  // 周记录管理
  static async getWeeklyRecords(): Promise<WeeklyRecord[]> {
    const db = await this.getDb();
    const result = await db.select().from(schema.weeklyRecords).orderBy(desc(schema.weeklyRecords.recordDate), desc(schema.weeklyRecords.createdAt));
    return result;
  }

  static async saveWeeklyRecord(record: Omit<WeeklyRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<WeeklyRecord> {
    const db = await this.getDb();
    const now = new Date().toISOString();

    // 检查是否已存在相同的账户和周记录
    const existing = await db.select().from(schema.weeklyRecords).where(
      and(
        eq(schema.weeklyRecords.accountId, record.accountId),
        eq(schema.weeklyRecords.recordDate, record.recordDate)
      )
    );

    const newRecord: WeeklyRecord = {
      ...record,
      id: existing.length > 0 ? existing[0].id : this.generateId(),
      createdAt: existing.length > 0 ? existing[0].createdAt : now,
      updatedAt: now
    };

    if (existing.length > 0) {
      await db.update(schema.weeklyRecords).set(newRecord).where(eq(schema.weeklyRecords.id, newRecord.id));
    } else {
      await db.insert(schema.weeklyRecords).values(newRecord);
    }

    return newRecord;
  }

  static async deleteWeeklyRecord(id: string): Promise<boolean> {
    const db = await this.getDb();
    const result = await db.delete(schema.weeklyRecords).where(eq(schema.weeklyRecords.id, id));
    return result.rowsAffected > 0;
  }

  static async deleteWeeklyRecordsByAccount(accountId: string): Promise<void> {
    const db = await this.getDb();
    await db.delete(schema.weeklyRecords).where(eq(schema.weeklyRecords.accountId, accountId));
  }

  // 查询功能
  static async getWeeklySummary(recordDate: string): Promise<WeeklySummary | null> {
    const db = await this.getDb();

    const result = await db
      .select({
        recordDate: schema.weeklyRecords.recordDate,
        accountId: schema.weeklyRecords.accountId,
        balance: schema.weeklyRecords.balance,
        accountName: schema.accounts.name,
        accountType: schema.accounts.type
      })
      .from(schema.weeklyRecords)
      .innerJoin(schema.accounts, eq(schema.weeklyRecords.accountId, schema.accounts.id))
      .where(eq(schema.weeklyRecords.recordDate, recordDate));

    if (result.length === 0) return null;

    const totalBalance = result.reduce((sum: number, record: any) => sum + record.balance, 0);

    return {
      recordDate,
      totalBalance,
      accounts: result.map((record: any) => ({
        accountId: record.accountId,
        accountName: record.accountName,
        accountType: record.accountType,
        balance: record.balance
      }))
    };
  }

  static async getAllWeeklySummaries(): Promise<WeeklySummary[]> {
    const db = await this.getDb();

    const result = await db
      .select({
        recordDate: schema.weeklyRecords.recordDate,
        accountId: schema.weeklyRecords.accountId,
        balance: schema.weeklyRecords.balance,
        accountName: schema.accounts.name,
        accountType: schema.accounts.type
      })
      .from(schema.weeklyRecords)
      .innerJoin(schema.accounts, eq(schema.weeklyRecords.accountId, schema.accounts.id))
      .orderBy(desc(schema.weeklyRecords.recordDate));

    // 按周分组
    const summariesByDate = result.reduce((acc: Record<string, any[]>, record: any) => {
      if (!acc[record.recordDate]) {
        acc[record.recordDate] = [];
      }
      acc[record.recordDate].push(record);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(summariesByDate).map(([recordDate, records]) => {
      const typedRecords = records as any[];
      const totalBalance = typedRecords.reduce((sum: number, record: any) => sum + record.balance, 0);

      return {
        recordDate,
        totalBalance,
        accounts: typedRecords.map((record: any) => ({
          accountId: record.accountId,
          accountName: record.accountName,
          accountType: record.accountType,
          balance: record.balance
        }))
      };
    });
  }

  static async getRecentWeeks(count: number = 12): Promise<WeeklySummary[]> {
    const allSummaries = await this.getAllWeeklySummaries();
    return allSummaries.slice(0, count);
  }

  static async getAccountBalanceHistory(accountId: string, limit: number = 10): Promise<WeeklyRecord[]> {
    const db = await this.getDb();
    const result = await db
      .select()
      .from(schema.weeklyRecords)
      .where(eq(schema.weeklyRecords.accountId, accountId))
      .orderBy(desc(schema.weeklyRecords.recordDate))
      .limit(limit);

    return result;
  }

  // 备注管理
  static async getWeeklyNotes(): Promise<WeeklyNote[]> {
    const db = await this.getDb();
    const result = await db.select().from(schema.weeklyNotes).orderBy(desc(schema.weeklyNotes.recordDate));
    return result;
  }

  static async saveWeeklyNote(note: Omit<WeeklyNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<WeeklyNote> {
    const db = await this.getDb();
    const now = new Date().toISOString();

    // 检查是否已存在该日期的备注
    const existing = await db.select().from(schema.weeklyNotes).where(eq(schema.weeklyNotes.recordDate, note.recordDate));

    const newNote: WeeklyNote = {
      ...note,
      id: existing.length > 0 ? existing[0].id : this.generateId(),
      createdAt: existing.length > 0 ? existing[0].createdAt : now,
      updatedAt: now
    };

    if (existing.length > 0) {
      await db.update(schema.weeklyNotes).set(newNote).where(eq(schema.weeklyNotes.id, newNote.id));
    } else {
      await db.insert(schema.weeklyNotes).values(newNote);
    }

    return newNote;
  }

  static async getWeeklyNote(recordDate: string): Promise<WeeklyNote | null> {
    const db = await this.getDb();
    const result = await db.select().from(schema.weeklyNotes).where(eq(schema.weeklyNotes.recordDate, recordDate));
    return result.length > 0 ? result[0] : null;
  }

  // 变动趋势计算
  static async calculateAccountChanges(accountId: string, currentRecordDate: string): Promise<AccountWithChanges | null> {
    const db = await this.getDb();

    // 获取账户信息
    const accounts = await db.select().from(schema.accounts).where(eq(schema.accounts.id, accountId));
    if (accounts.length === 0) return null;

    const account = accounts[0];

    // 获取账户的所有记录，按日期排序
    const allRecords = await db
      .select()
      .from(schema.weeklyRecords)
      .where(eq(schema.weeklyRecords.accountId, accountId))
      .orderBy(schema.weeklyRecords.recordDate);

    if (allRecords.length === 0) return null;

    // 找到当前记录
    const currentRecord = allRecords.find((r: any) => r.recordDate === currentRecordDate) || allRecords[allRecords.length - 1];
    const currentBalance = currentRecord.balance;

    // 计算周变动（与上一周比较）
    const currentIndex = allRecords.findIndex((r: any) => r.id === currentRecord.id);
    const weeklyChange = currentIndex > 0 ? currentBalance - allRecords[currentIndex - 1].balance : 0;

    // 计算月度变动（与4周前比较）
    const monthlyIndex = Math.max(0, currentIndex - 4);
    const monthlyChange = currentIndex > monthlyIndex ? currentBalance - allRecords[monthlyIndex].balance : 0;

    // 计算季度变动（与12周前比较）
    const quarterlyIndex = Math.max(0, currentIndex - 12);
    const quarterlyChange = currentIndex > quarterlyIndex ? currentBalance - allRecords[quarterlyIndex].balance : 0;

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

}