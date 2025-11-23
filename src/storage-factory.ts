import { Account, WeeklyRecord, WeeklySummary, WeeklyNote, AccountWithChanges, getRecordDate } from './types';
import { DrizzleStorageService as NewDrizzleStorageService } from './drizzle-storage';

export type StorageType = 'drizzle-orm';

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



// 存储服务适配器 - Drizzle ORM 适配器（新版，基于 SQLite）
class DrizzleOrmAdapter implements IStorageService {
  async getAccounts(): Promise<Account[]> {
    return NewDrizzleStorageService.getAccounts();
  }

  async saveAccount(account: Omit<Account, 'id' | 'createdAt'>): Promise<Account> {
    return NewDrizzleStorageService.saveAccount(account);
  }

  async updateAccount(id: string, updates: Partial<Account>): Promise<Account | null> {
    return NewDrizzleStorageService.updateAccount(id, updates);
  }

  async deleteAccount(id: string): Promise<boolean> {
    return NewDrizzleStorageService.deleteAccount(id);
  }

  async getWeeklyRecords(): Promise<WeeklyRecord[]> {
    return NewDrizzleStorageService.getWeeklyRecords();
  }

  async saveWeeklyRecord(record: Omit<WeeklyRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<WeeklyRecord> {
    return NewDrizzleStorageService.saveWeeklyRecord(record);
  }

  async deleteWeeklyRecord(id: string): Promise<boolean> {
    return NewDrizzleStorageService.deleteWeeklyRecord(id);
  }

  async deleteWeeklyRecordsByAccount(accountId: string): Promise<void> {
    return NewDrizzleStorageService.deleteWeeklyRecordsByAccount(accountId);
  }

  async getWeeklySummary(recordDate: string): Promise<WeeklySummary | null> {
    return NewDrizzleStorageService.getWeeklySummary(recordDate);
  }

  async getAllWeeklySummaries(): Promise<WeeklySummary[]> {
    return NewDrizzleStorageService.getAllWeeklySummaries();
  }

  async getRecentWeeks(count: number = 12): Promise<WeeklySummary[]> {
    return NewDrizzleStorageService.getRecentWeeks(count);
  }

  async getAccountBalanceHistory(accountId: string, limit: number = 10): Promise<WeeklyRecord[]> {
    return NewDrizzleStorageService.getAccountBalanceHistory(accountId, limit);
  }

  async getWeeklyNotes(): Promise<WeeklyNote[]> {
    return NewDrizzleStorageService.getWeeklyNotes();
  }

  async saveWeeklyNote(note: Omit<WeeklyNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<WeeklyNote> {
    return NewDrizzleStorageService.saveWeeklyNote(note);
  }

  async getWeeklyNote(recordDate: string): Promise<WeeklyNote | null> {
    return NewDrizzleStorageService.getWeeklyNote(recordDate);
  }

  async calculateAccountChanges(accountId: string, currentRecordDate: string): Promise<AccountWithChanges | null> {
    return NewDrizzleStorageService.calculateAccountChanges(accountId, currentRecordDate);
  }

  async getAllAccountsWithChanges(currentRecordDate: string = getRecordDate()): Promise<AccountWithChanges[]> {
    return NewDrizzleStorageService.getAllAccountsWithChanges(currentRecordDate);
  }

  async initializeSampleData(): Promise<void> {
    return NewDrizzleStorageService.initializeSampleData();
  }
}

// 存储服务工厂
export class StorageFactory {
  private static currentStorage: IStorageService | null = null;
  private static currentType: StorageType | null = null;

  static async getStorageService(type: StorageType = 'drizzle-orm'): Promise<IStorageService> {
    // 如果已经初始化过相同类型的服务，直接返回
    if (this.currentStorage && this.currentType === type) {
      return this.currentStorage;
    }

    // 创建 Drizzle ORM 服务
    this.currentStorage = new DrizzleOrmAdapter();
    this.currentType = type;
    return this.currentStorage;
  }

  static getCurrentStorageType(): StorageType | null {
    return this.currentType;
  }

  static async switchStorage(type: StorageType): Promise<IStorageService> {
    return this.getStorageService(type);
  }

}

// 为了向后兼容，导出一个默认的存储服务实例
// 默认使用 Drizzle ORM + SQLite
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