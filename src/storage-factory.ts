import { Account, WeeklyRecord, WeeklySummary, WeeklyNote, AccountWithChanges, getRecordDate } from './types';
import { StorageService } from './storage';
import { DrizzleStorageService } from './legacy-drizzle-storage';
import { SQLiteStorageService } from './sqlite-storage';

export type StorageType = 'localStorage' | 'drizzle' | 'sqlite';

// 存储服务接口，确保两个实现保持一致
export interface IStorageService {
  // 账户管理
  getAccounts(): Promise<Account[]> | Account[];
  saveAccount(account: Omit<Account, 'id' | 'createdAt'>): Promise<Account> | Account;
  updateAccount(id: string, updates: Partial<Account>): Promise<Account | null> | (Account | null);
  deleteAccount(id: string): Promise<boolean> | boolean;

  // 周记录管理
  getWeeklyRecords(): Promise<WeeklyRecord[]> | WeeklyRecord[];
  saveWeeklyRecord(record: Omit<WeeklyRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<WeeklyRecord> | WeeklyRecord;
  deleteWeeklyRecord(id: string): Promise<boolean> | boolean;
  deleteWeeklyRecordsByAccount(accountId: string): Promise<void> | void;

  // 查询功能
  getWeeklySummary(recordDate: string): Promise<WeeklySummary | null> | (WeeklySummary | null);
  getAllWeeklySummaries(): Promise<WeeklySummary[]> | WeeklySummary[];
  getRecentWeeks(count?: number): Promise<WeeklySummary[]> | WeeklySummary[];
  getAccountBalanceHistory(accountId: string, limit?: number): Promise<WeeklyRecord[]> | WeeklyRecord[];

  // 备注管理
  getWeeklyNotes(): Promise<WeeklyNote[]> | WeeklyNote[];
  saveWeeklyNote(note: Omit<WeeklyNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<WeeklyNote> | WeeklyNote;
  getWeeklyNote(recordDate: string): Promise<WeeklyNote | null> | (WeeklyNote | null);

  // 变动趋势计算
  calculateAccountChanges(accountId: string, currentRecordDate: string): Promise<AccountWithChanges | null> | (AccountWithChanges | null);
  getAllAccountsWithChanges(currentRecordDate?: string): Promise<AccountWithChanges[]> | AccountWithChanges[];

  // 初始化示例数据
  initializeSampleData(): Promise<void> | void;
}

// 存储服务适配器 - localStorage 适配器
class LocalStorageAdapter implements IStorageService {
  async getAccounts(): Promise<Account[]> {
    return StorageService.getAccounts();
  }

  async saveAccount(account: Omit<Account, 'id' | 'createdAt'>): Promise<Account> {
    return StorageService.saveAccount(account);
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account | null> {
    return StorageService.updateAccount(id, updates);
  }

  async deleteAccount(id: string): Promise<boolean> {
    return StorageService.deleteAccount(id);
  }

  async getWeeklyRecords(): Promise<WeeklyRecord[]> {
    return StorageService.getWeeklyRecords();
  }

  async saveWeeklyRecord(record: Omit<WeeklyRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<WeeklyRecord> {
    return StorageService.saveWeeklyRecord(record);
  }

  async deleteWeeklyRecord(id: string): Promise<boolean> {
    return StorageService.deleteWeeklyRecord(id);
  }

  async deleteWeeklyRecordsByAccount(accountId: string): Promise<void> {
    return StorageService.deleteWeeklyRecordsByAccount(accountId);
  }

  async getWeeklySummary(recordDate: string): Promise<WeeklySummary | null> {
    return StorageService.getWeeklySummary(recordDate);
  }

  async getAllWeeklySummaries(): Promise<WeeklySummary[]> {
    return StorageService.getAllWeeklySummaries();
  }

  async getRecentWeeks(count: number = 12): Promise<WeeklySummary[]> {
    return StorageService.getRecentWeeks(count);
  }

  async getAccountBalanceHistory(accountId: string, limit: number = 10): Promise<WeeklyRecord[]> {
    return StorageService.getAccountBalanceHistory(accountId, limit);
  }

  async getWeeklyNotes(): Promise<WeeklyNote[]> {
    return StorageService.getWeeklyNotes();
  }

  async saveWeeklyNote(note: Omit<WeeklyNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<WeeklyNote> {
    return StorageService.saveWeeklyNote(note);
  }

  async getWeeklyNote(recordDate: string): Promise<WeeklyNote | null> {
    return StorageService.getWeeklyNote(recordDate);
  }

  async calculateAccountChanges(accountId: string, currentRecordDate: string): Promise<AccountWithChanges | null> {
    return StorageService.calculateAccountChanges(accountId, currentRecordDate);
  }

  async getAllAccountsWithChanges(currentRecordDate: string = getRecordDate()): Promise<AccountWithChanges[]> {
    return StorageService.getAllAccountsWithChanges(currentRecordDate);
  }

  async initializeSampleData(): Promise<void> {
    return StorageService.initializeSampleData();
  }
}


// 存储服务适配器 - SQLite 适配器
class SQLiteAdapter implements IStorageService {
  async getAccounts(): Promise<Account[]> {
    return SQLiteStorageService.getAccounts();
  }

  async saveAccount(account: Omit<Account, 'id' | 'createdAt'>): Promise<Account> {
    return SQLiteStorageService.saveAccount(account);
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account | null> {
    return SQLiteStorageService.updateAccount(id, updates);
  }

  async deleteAccount(id: string): Promise<boolean> {
    return SQLiteStorageService.deleteAccount(id);
  }

  async getWeeklyRecords(): Promise<WeeklyRecord[]> {
    return SQLiteStorageService.getWeeklyRecords();
  }

  async saveWeeklyRecord(record: Omit<WeeklyRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<WeeklyRecord> {
    return SQLiteStorageService.saveWeeklyRecord(record);
  }

  async deleteWeeklyRecord(id: string): Promise<boolean> {
    return SQLiteStorageService.deleteWeeklyRecord(id);
  }

  async deleteWeeklyRecordsByAccount(accountId: string): Promise<void> {
    return SQLiteStorageService.deleteWeeklyRecordsByAccount(accountId);
  }

  async getWeeklySummary(recordDate: string): Promise<WeeklySummary | null> {
    return SQLiteStorageService.getWeeklySummary(recordDate);
  }

  async getAllWeeklySummaries(): Promise<WeeklySummary[]> {
    return SQLiteStorageService.getAllWeeklySummaries();
  }

  async getRecentWeeks(count: number = 12): Promise<WeeklySummary[]> {
    return SQLiteStorageService.getRecentWeeks(count);
  }

  async getAccountBalanceHistory(accountId: string, limit: number = 10): Promise<WeeklyRecord[]> {
    return SQLiteStorageService.getAccountBalanceHistory(accountId, limit);
  }

  async getWeeklyNotes(): Promise<WeeklyNote[]> {
    return SQLiteStorageService.getWeeklyNotes();
  }

  async saveWeeklyNote(note: Omit<WeeklyNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<WeeklyNote> {
    return SQLiteStorageService.saveWeeklyNote(note);
  }

  async getWeeklyNote(recordDate: string): Promise<WeeklyNote | null> {
    return SQLiteStorageService.getWeeklyNote(recordDate);
  }

  async calculateAccountChanges(accountId: string, currentRecordDate: string): Promise<AccountWithChanges | null> {
    return SQLiteStorageService.calculateAccountChanges(accountId, currentRecordDate);
  }

  async getAllAccountsWithChanges(currentRecordDate: string = getRecordDate()): Promise<AccountWithChanges[]> {
    return SQLiteStorageService.getAllAccountsWithChanges(currentRecordDate);
  }

  async initializeSampleData(): Promise<void> {
    return SQLiteStorageService.initializeSampleData();
  }
}

// 存储服务适配器 - Drizzle 适配器
class DrizzleAdapter implements IStorageService {
  async getAccounts(): Promise<Account[]> {
    return DrizzleStorageService.getAccounts();
  }

  async saveAccount(account: Omit<Account, 'id' | 'createdAt'>): Promise<Account> {
    return DrizzleStorageService.saveAccount(account);
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account | null> {
    return DrizzleStorageService.updateAccount(id, updates);
  }

  async deleteAccount(id: string): Promise<boolean> {
    return DrizzleStorageService.deleteAccount(id);
  }

  async getWeeklyRecords(): Promise<WeeklyRecord[]> {
    return DrizzleStorageService.getWeeklyRecords();
  }

  async saveWeeklyRecord(record: Omit<WeeklyRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<WeeklyRecord> {
    return DrizzleStorageService.saveWeeklyRecord(record);
  }

  async deleteWeeklyRecord(id: string): Promise<boolean> {
    return DrizzleStorageService.deleteWeeklyRecord(id);
  }

  async deleteWeeklyRecordsByAccount(accountId: string): Promise<void> {
    return DrizzleStorageService.deleteWeeklyRecordsByAccount(accountId);
  }

  async getWeeklySummary(recordDate: string): Promise<WeeklySummary | null> {
    return DrizzleStorageService.getWeeklySummary(recordDate);
  }

  async getAllWeeklySummaries(): Promise<WeeklySummary[]> {
    return DrizzleStorageService.getAllWeeklySummaries();
  }

  async getRecentWeeks(count: number = 12): Promise<WeeklySummary[]> {
    return DrizzleStorageService.getRecentWeeks(count);
  }

  async getAccountBalanceHistory(accountId: string, limit: number = 10): Promise<WeeklyRecord[]> {
    return DrizzleStorageService.getAccountBalanceHistory(accountId, limit);
  }

  async getWeeklyNotes(): Promise<WeeklyNote[]> {
    return DrizzleStorageService.getWeeklyNotes();
  }

  async saveWeeklyNote(note: Omit<WeeklyNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<WeeklyNote> {
    return DrizzleStorageService.saveWeeklyNote(note);
  }

  async getWeeklyNote(recordDate: string): Promise<WeeklyNote | null> {
    return DrizzleStorageService.getWeeklyNote(recordDate);
  }

  async calculateAccountChanges(accountId: string, currentRecordDate: string): Promise<AccountWithChanges | null> {
    return DrizzleStorageService.calculateAccountChanges(accountId, currentRecordDate);
  }

  async getAllAccountsWithChanges(currentRecordDate: string = getRecordDate()): Promise<AccountWithChanges[]> {
    return DrizzleStorageService.getAllAccountsWithChanges(currentRecordDate);
  }

  async initializeSampleData(): Promise<void> {
    return DrizzleStorageService.initializeSampleData();
  }
}

// 存储服务工厂
export class StorageFactory {
  private static currentStorage: IStorageService | null = null;
  private static currentType: StorageType | null = null;

  static async getStorageService(type: StorageType = 'sqlite'): Promise<IStorageService> {
    // 如果已经初始化过相同类型的服务，直接返回
    if (this.currentStorage && this.currentType === type) {
      return this.currentStorage;
    }

    // 根据类型创建相应的服务
    switch (type) {
      case 'localStorage':
        this.currentStorage = new LocalStorageAdapter();
        break;
      case 'drizzle':
        this.currentStorage = new DrizzleAdapter();
        break;
      case 'sqlite':
        this.currentStorage = new SQLiteAdapter();
        break;
      default:
        throw new Error(`Unsupported storage type: ${type}`);
    }

    this.currentType = type;
    return this.currentStorage;
  }

  static getCurrentStorageType(): StorageType | null {
    return this.currentType;
  }

  static async switchStorage(type: StorageType): Promise<IStorageService> {
    return this.getStorageService(type);
  }

  // 数据迁移
  static async migrateToSQLite(): Promise<void> {
    try {
      console.log('Starting migration to SQLite...');

      // 初始化 SQLite
      await this.getStorageService('sqlite');

      // 执行迁移
      await SQLiteStorageService.migrateFromLocalStorage();

      console.log('Migration to SQLite completed successfully');
    } catch (error) {
      console.error('Migration to SQLite failed:', error);
      throw error;
    }
  }

  // 向后兼容 - 保持原有方法名
  static async migrateToDrizzle(): Promise<void> {
    return this.migrateToSQLite();
  }

  // 检查是否需要迁移到 SQLite
  static async shouldMigrateToSQLite(): Promise<boolean> {
    try {
      // 检查 localStorage 是否有数据
      const hasLocalStorageData = localStorage.getItem('assets_accounts') ||
                                  localStorage.getItem('assets_weekly_records') ||
                                  localStorage.getItem('assets_weekly_notes');

      if (!hasLocalStorageData) {
        return false;
      }

      // 检查 SQLite 是否已有数据
      const sqliteService = await this.getStorageService('sqlite');
      const accounts = await sqliteService.getAccounts();

      return accounts.length === 0; // 如果 localStorage 有数据但 SQLite 没有，则需要迁移
    } catch (error) {
      console.error('Error checking migration status:', error);
      return false;
    }
  }

  // 向后兼容 - 保持原有方法名
  static async shouldMigrateToDrizzle(): Promise<boolean> {
    return this.shouldMigrateToSQLite();
  }
}

// 为了向后兼容，导出一个默认的存储服务实例
// 默认使用 localStorage，保持与现有代码的兼容性
export const storageService = {
  async getAccounts(): Promise<Account[]> {
    const service = await StorageFactory.getStorageService();
    return service.getAccounts();
  },

  async saveAccount(account: Omit<Account, 'id' | 'createdAt'>): Promise<Account> {
    const service = await StorageFactory.getStorageService();
    return service.saveAccount(account);
  },

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account | null> {
    const service = await StorageFactory.getStorageService();
    return service.updateAccount(id, updates);
  },

  async deleteAccount(id: string): Promise<boolean> {
    const service = await StorageFactory.getStorageService();
    return service.deleteAccount(id);
  },

  async getWeeklyRecords(): Promise<WeeklyRecord[]> {
    const service = await StorageFactory.getStorageService();
    return service.getWeeklyRecords();
  },

  async saveWeeklyRecord(record: Omit<WeeklyRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<WeeklyRecord> {
    const service = await StorageFactory.getStorageService();
    return service.saveWeeklyRecord(record);
  },

  async deleteWeeklyRecord(id: string): Promise<boolean> {
    const service = await StorageFactory.getStorageService();
    return service.deleteWeeklyRecord(id);
  },

  async deleteWeeklyRecordsByAccount(accountId: string): Promise<void> {
    const service = await StorageFactory.getStorageService();
    return service.deleteWeeklyRecordsByAccount(accountId);
  },

  async getWeeklySummary(recordDate: string): Promise<WeeklySummary | null> {
    const service = await StorageFactory.getStorageService();
    return service.getWeeklySummary(recordDate);
  },

  async getAllWeeklySummaries(): Promise<WeeklySummary[]> {
    const service = await StorageFactory.getStorageService();
    return service.getAllWeeklySummaries();
  },

  async getRecentWeeks(count: number = 12): Promise<WeeklySummary[]> {
    const service = await StorageFactory.getStorageService();
    return service.getRecentWeeks(count);
  },

  async getAccountBalanceHistory(accountId: string, limit: number = 10): Promise<WeeklyRecord[]> {
    const service = await StorageFactory.getStorageService();
    return service.getAccountBalanceHistory(accountId, limit);
  },

  async getWeeklyNotes(): Promise<WeeklyNote[]> {
    const service = await StorageFactory.getStorageService();
    return service.getWeeklyNotes();
  },

  async saveWeeklyNote(note: Omit<WeeklyNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<WeeklyNote> {
    const service = await StorageFactory.getStorageService();
    return service.saveWeeklyNote(note);
  },

  async getWeeklyNote(recordDate: string): Promise<WeeklyNote | null> {
    const service = await StorageFactory.getStorageService();
    return service.getWeeklyNote(recordDate);
  },

  async calculateAccountChanges(accountId: string, currentRecordDate: string): Promise<AccountWithChanges | null> {
    const service = await StorageFactory.getStorageService();
    return service.calculateAccountChanges(accountId, currentRecordDate);
  },

  async getAllAccountsWithChanges(currentRecordDate: string = getRecordDate()): Promise<AccountWithChanges[]> {
    const service = await StorageFactory.getStorageService();
    return service.getAllAccountsWithChanges(currentRecordDate);
  },

  async initializeSampleData(): Promise<void> {
    const service = await StorageFactory.getStorageService();
    return service.initializeSampleData();
  }
};