<template>
  <div class="weekly-record-manager">
    <div class="header">
      <h2>周记录</h2>
      <div class="header-actions">
        <select v-model="selectedWeek" @change="loadWeeklySummary" class="week-selector">
          <option v-for="week in recentWeeks" :key="week.recordDate" :value="week.recordDate">
            {{ formatWeekRange(week.recordDate) }}
          </option>
        </select>
        <button @click="showAddForm = true" class="btn btn-primary">记录本周余额</button>
      </div>
    </div>

    <!-- 当前周汇总 -->
    <div v-if="weeklySummary" class="weekly-summary">
      <div class="summary-header">
        <h3>{{ formatWeekRange(weeklySummary.recordDate) }}</h3>
        <div class="total-balance">总资产: {{ formatCurrency(weeklySummary.totalBalance) }}</div>
      </div>

      <div class="account-balances">
        <div
          v-for="account in weeklySummary.accounts"
          :key="account.accountId"
          class="account-balance"
        >
          <div class="account-info">
            <span class="account-name">{{ account.accountName }}</span>
            <span class="account-type">{{ getAccountTypeLabel(account.accountType as any) }}</span>
          </div>
          <div class="balance">{{ formatCurrency(account.balance) }}</div>
        </div>
      </div>
    </div>

    <div v-else-if="selectedWeek" class="empty-week">
      <p>{{ formatWeekRange(selectedWeek) }} 暂无记录</p>
      <button @click="showAddForm = true" class="btn btn-primary">添加记录</button>
    </div>

    <!-- 添加/编辑周记录弹窗 -->
    <div v-if="showAddForm" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <h3>记录{{ formatWeekRange(targetWeek) }}余额</h3>
        <form @submit.prevent="saveWeeklyRecords">
          <div class="form-intro">
            <p>请为每个账户输入当前余额</p>
          </div>

          <div v-if="accounts.length === 0" class="no-accounts">
            <p>请先添加账户</p>
          </div>

          <div v-for="account in accounts" :key="account.id" class="account-record">
            <label class="account-label">
              {{ account.name }} ({{ getAccountTypeLabel(account.type) }})
            </label>
            <div class="balance-input">
              <span class="currency-symbol">¥</span>
              <input
                v-model.number="balances[account.id]"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div class="form-actions" v-if="accounts.length > 0">
            <button type="submit" class="btn btn-primary">保存记录</button>
            <button type="button" @click="closeModal" class="btn btn-secondary">取消</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 历史记录 -->
    <div class="history-section">
      <h3>历史记录</h3>
      <div v-if="history.length === 0" class="empty-history">
        <p>暂无历史记录</p>
      </div>
      <div v-else class="history-list">
        <div v-for="record in history" :key="record.recordDate" class="history-item">
          <div class="history-week">{{ formatWeekRange(record.recordDate) }}</div>
          <div class="history-total">{{ formatCurrency(record.totalBalance) }}</div>
          <button @click="viewHistoryDetail(record)" class="btn btn-outline">查看详情</button>
        </div>
      </div>
    </div>

    <!-- 历史详情弹窗 -->
    <div v-if="showHistoryDetail" class="modal-overlay" @click="closeHistoryDetail">
      <div class="modal" @click.stop>
        <h3>{{ formatWeekRange(historyDetail?.recordDate || '') }} 详情</h3>
        <div v-if="historyDetail" class="detail-accounts">
          <div
            v-for="account in historyDetail.accounts"
            :key="account.accountId"
            class="detail-account"
          >
            <div class="detail-info">
              <span class="detail-name">{{ account.accountName }}</span>
              <span class="detail-type">{{ getAccountTypeLabel(account.accountType as any) }}</span>
            </div>
            <div class="detail-balance">{{ formatCurrency(account.balance) }}</div>
          </div>
        </div>
        <div class="detail-total">
          <strong>总计: {{ formatCurrency(historyDetail?.totalBalance || 0) }}</strong>
        </div>
        <div class="form-actions">
          <button @click="closeHistoryDetail" class="btn btn-secondary">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { storageService } from '../storage-factory';
import { getRecordDate, formatCurrency, getAccountTypeLabel } from '../types';
import type { WeeklySummary, Account } from '../types';

const accounts = ref<Account[]>([]);
const weeklySummary = ref<WeeklySummary | null>(null);
const recentWeeks = ref<WeeklySummary[]>([]);
const selectedWeek = ref<string>('');
const history = ref<WeeklySummary[]>([]);

const showAddForm = ref(false);
const showHistoryDetail = ref(false);
const historyDetail = ref<WeeklySummary | null>(null);

const targetWeek = computed(() => getRecordDate());
const balances = ref<Record<string, number>>({});

const loadAccounts = async () => {
  accounts.value = await storageService.getAccounts();
};

const loadWeeklySummary = async () => {
  if (selectedWeek.value) {
    weeklySummary.value = await storageService.getWeeklySummary(selectedWeek.value);
  }
};

const loadRecentWeeks = async () => {
  recentWeeks.value = await storageService.getRecentWeeks(12);
  history.value = await storageService.getAllWeeklySummaries();

  // 设置默认选中的周
  const currentWeek = getRecordDate();
  selectedWeek.value = currentWeek;

  // 如果当前周没有记录，添加到选项中
  if (!recentWeeks.value.some(w => w.recordDate === currentWeek)) {
    const currentWeekOption = {
      recordDate: currentWeek,
      totalBalance: 0,
      accounts: [],
    };
    recentWeeks.value.unshift(currentWeekOption);
  }
};

const saveWeeklyRecords = async () => {
  for (const [accountId, balance] of Object.entries(balances.value)) {
    await storageService.saveWeeklyRecord({
      accountId,
      recordDate: targetWeek.value,
      balance: balance || 0,
    });
  }

  closeModal();
  await loadRecentWeeks();
  await loadWeeklySummary();
};

const viewHistoryDetail = (record: WeeklySummary) => {
  historyDetail.value = record;
  showHistoryDetail.value = true;
};

const closeModal = () => {
  showAddForm.value = false;
  balances.value = {};
};

const closeHistoryDetail = () => {
  showHistoryDetail.value = false;
  historyDetail.value = null;
};

const formatWeekRange = (startDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const formatDate = (date: Date) => {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const year = start.getFullYear();
  const currentYear = new Date().getFullYear();

  return currentYear === year
    ? `${formatDate(start)} - ${formatDate(end)}`
    : `${year} ${formatDate(start)} - ${formatDate(end)}`;
};

onMounted(() => {
  loadAccounts();
  loadRecentWeeks();
  loadWeeklySummary();
});
</script>

<style scoped>
.weekly-record-manager {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header h2 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.week-selector {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: white;
}

.weekly-summary {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 32px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.summary-header h3 {
  margin: 0;
  color: #333;
}

.total-balance {
  font-size: 18px;
  font-weight: bold;
  color: #1976d2;
}

.account-balances {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.account-balance {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.account-balance:last-child {
  border-bottom: none;
}

.account-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.account-name {
  font-weight: 500;
  color: #333;
}

.account-type {
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  display: inline-block;
  width: fit-content;
}

.balance {
  font-size: 16px;
  font-weight: bold;
  color: #1976d2;
}

.empty-week {
  text-align: center;
  padding: 40px;
  background: #f9f9f9;
  border-radius: 8px;
  color: #666;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.modal h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.form-intro {
  margin-bottom: 20px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

.form-intro p {
  margin: 0;
  color: #666;
}

.no-accounts {
  text-align: center;
  padding: 20px;
  color: #666;
}

.account-record {
  margin-bottom: 16px;
}

.account-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.balance-input {
  display: flex;
  align-items: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.currency-symbol {
  background: #f5f5f5;
  padding: 8px 12px;
  border-right: 1px solid #ddd;
  color: #666;
  font-weight: 500;
}

.balance-input input {
  flex: 1;
  padding: 8px 12px;
  border: none;
  font-size: 14px;
  outline: none;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.history-section {
  margin-top: 32px;
}

.history-section h3 {
  margin: 0 0 16px 0;
  color: #333;
}

.empty-history {
  text-align: center;
  padding: 40px;
  background: #f9f9f9;
  border-radius: 8px;
  color: #666;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}

.history-week {
  flex: 1;
  font-weight: 500;
  color: #333;
}

.history-total {
  flex: 1;
  text-align: center;
  font-weight: bold;
  color: #1976d2;
}

.detail-accounts {
  margin-bottom: 20px;
}

.detail-account {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.detail-account:last-child {
  border-bottom: none;
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-name {
  font-weight: 500;
  color: #333;
}

.detail-type {
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  display: inline-block;
  width: fit-content;
}

.detail-balance {
  font-weight: bold;
  color: #1976d2;
}

.detail-total {
  text-align: center;
  padding: 16px 0;
  border-top: 2px solid #e0e0e0;
  margin-top: 16px;
  font-size: 18px;
  color: #1976d2;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-primary:hover {
  background: #1565c0;
}

.btn-secondary {
  background: #757575;
  color: white;
}

.btn-secondary:hover {
  background: #616161;
}

.btn-outline {
  background: transparent;
  color: #1976d2;
  border: 1px solid #1976d2;
}

.btn-outline:hover {
  background: #e3f2fd;
}
</style>
