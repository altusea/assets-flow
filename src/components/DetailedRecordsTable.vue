<template>
  <div class="detailed-records-table">
    <div class="table-header">
      <h3>详细记录表</h3>
      <div class="table-controls">
        <select v-model="selectedWeek" @change="loadTableData" class="week-selector">
          <option v-for="week in availableWeeks" :key="week.recordDate" :value="week.recordDate">
            {{ formatWeekRange(week.recordDate) }}
          </option>
        </select>
        <button @click="showNotesModal = true" class="btn btn-secondary">📝 编辑备注</button>
        <button @click="exportTable" class="btn btn-outline">📊 导出表格</button>
      </div>
    </div>

    <!-- 详细表格 -->
    <div class="table-container">
      <table class="detailed-table">
        <thead>
          <tr>
            <th>记录时间</th>
            <th>建行</th>
            <th>工行</th>
            <th>广发</th>
            <th>现金</th>
            <th>支付宝</th>
            <th>微信</th>
            <th>基金股票</th>
            <th>合计</th>
            <th>变动（周）</th>
            <th>变动（4/5周）</th>
            <th>变动（季度）</th>
            <th>备注（支出）</th>
            <th>备注（收入）</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="record in tableData"
            :key="record.recordDate"
            :class="{ 'current-week': record.isCurrentWeek }"
          >
            <td class="time-cell">
              {{ formatTime(record.recordDate) }}
              <span v-if="record.isCurrentWeek" class="current-indicator">本周</span>
            </td>
            <td v-for="account in accountColumns" :key="account.key" class="balance-cell">
              {{ formatCurrency(record.balances[account.key] || 0) }}
            </td>
            <td class="total-cell">{{ formatCurrency(record.totalBalance) }}</td>
            <td class="change-cell" :class="getChangeClass(record.weeklyChange)">
              {{ formatChange(record.weeklyChange) }}
            </td>
            <td class="change-cell" :class="getChangeClass(record.monthlyChange)">
              {{ formatChange(record.monthlyChange) }}
            </td>
            <td class="change-cell" :class="getChangeClass(record.quarterlyChange)">
              {{ formatChange(record.quarterlyChange) }}
            </td>
            <td class="note-cell expense-note" @click="editNote(record.recordDate)">
              {{ record.expenseNote || '点击添加' }}
            </td>
            <td class="note-cell income-note" @click="editNote(record.recordDate)">
              {{ record.incomeNote || '点击添加' }}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="summary-row">
            <td>汇总</td>
            <td v-for="account in accountColumns" :key="account.key" class="summary-cell">
              {{ formatCurrency(getAccountAverage(account.key)) }}
            </td>
            <td class="total-summary">{{ formatCurrency(getOverallAverage()) }}</td>
            <td colspan="4"></td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- 备注编辑弹窗 -->
    <div v-if="showNotesModal" class="modal-overlay" @click="closeNotesModal">
      <div class="modal notes-modal" @click.stop>
        <h3>编辑备注 - {{ formatWeekRange(notesForm.recordDate) }}</h3>
        <form @submit.prevent="saveNotes">
          <div class="form-group">
            <label for="incomeNote">收入备注</label>
            <textarea
              id="incomeNote"
              v-model="notesForm.incomeNote"
              placeholder="记录本周收入情况..."
              rows="3"
            ></textarea>
          </div>
          <div class="form-group">
            <label for="expenseNote">支出备注</label>
            <textarea
              id="expenseNote"
              v-model="notesForm.expenseNote"
              placeholder="记录本周支出情况..."
              rows="3"
            ></textarea>
          </div>
          <div class="form-actions">
            <button type="submit" class="btn btn-primary">保存备注</button>
            <button type="button" @click="closeNotesModal" class="btn btn-secondary">取消</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { storageService } from '../storage-factory';
import { formatCurrency, getRecordDate } from '../types';
import type { WeeklySummary } from '../types';

interface TableData {
  recordDate: string;
  isCurrentWeek: boolean;
  totalBalance: number;
  weeklyChange: number;
  monthlyChange: number;
  quarterlyChange: number;
  balances: Record<string, number>;
  expenseNote?: string;
  incomeNote?: string;
}

const availableWeeks = ref<WeeklySummary[]>([]);
const selectedWeek = ref<string>('');
const tableData = ref<TableData[]>([]);
const showNotesModal = ref(false);

const notesForm = ref({
  recordDate: '',
  incomeNote: '',
  expenseNote: '',
});

// 账户列配置
const accountColumns = [
  { key: 'ccbank', name: '建行' },
  { key: 'icbc', name: '工行' },
  { key: 'cgb', name: '广发' },
  { key: 'cash', name: '现金' },
  { key: 'alipay', name: '支付宝' },
  { key: 'wechat', name: '微信' },
  { key: 'funds', name: '基金股票' },
];

const loadAvailableWeeks = async () => {
  availableWeeks.value = await storageService.getAllWeeklySummaries();

  const currentWeek = getRecordDate();
  selectedWeek.value = currentWeek;
};

const loadTableData = async () => {
  const history = await storageService.getAllWeeklySummaries();
  const notes = await storageService.getWeeklyNotes();

  // 创建账户ID到列的映射
  const accountToColumn: Record<string, string> = {};
  const accounts = await storageService.getAccounts();

  accounts.forEach(account => {
    // 根据账户名称匹配到对应列
    if (account.name.includes('建行')) accountToColumn[account.id] = 'ccbank';
    else if (account.name.includes('工行')) accountToColumn[account.id] = 'icbc';
    else if (account.name.includes('广发')) accountToColumn[account.id] = 'cgb';
    else if (account.name.includes('现金')) accountToColumn[account.id] = 'cash';
    else if (account.name.includes('支付宝')) accountToColumn[account.id] = 'alipay';
    else if (account.name.includes('微信')) accountToColumn[account.id] = 'wechat';
    else if (account.name.includes('基金') || account.name.includes('股票'))
      accountToColumn[account.id] = 'funds';
  });

  tableData.value = history.slice(0, 8).map((record, index) => {
    const balances: Record<string, number> = {};
    let totalBalance = 0;

    // 将账户余额映射到表格列
    record.accounts.forEach(account => {
      const column = accountToColumn[account.accountId];
      if (column) {
        balances[column] = account.balance;
        totalBalance += account.balance;
      }
    });

    // 填充缺失的账户列为0
    accountColumns.forEach(col => {
      if (!balances[col.key]) {
        balances[col.key] = 0;
      }
    });

    // 获取备注
    const note = notes.find(n => n.recordDate === record.recordDate);

    // 计算变动（简化版本，基于总资产）
    const weeklyChange =
      index < history.length - 1 ? record.totalBalance - history[index + 1].totalBalance : 0;
    const monthlyChange =
      index < 4 && index + 4 < history.length
        ? record.totalBalance - history[index + 4].totalBalance
        : 0;
    const quarterlyChange =
      index < 12 && index + 12 < history.length
        ? record.totalBalance - history[index + 12].totalBalance
        : 0;

    return {
      recordDate: record.recordDate,
      isCurrentWeek: record.recordDate === getRecordDate(),
      totalBalance,
      weeklyChange,
      monthlyChange,
      quarterlyChange,
      balances,
      expenseNote: note?.expenseNote,
      incomeNote: note?.incomeNote,
    };
  });
};

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  const isThisWeek = dateString === getRecordDate();

  if (isThisWeek) {
    return `${date.getMonth() + 1}/${date.getDate()} 晚`;
  }

  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const formatWeekRange = (startDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  return `${start.getMonth() + 1}/${start.getDate()} - ${end.getMonth() + 1}/${end.getDate()}`;
};

const formatChange = (change: number): string => {
  if (change === 0) return '-';
  const prefix = change > 0 ? '+' : '';
  return `${prefix}${formatCurrency(Math.abs(change))}`;
};

const getChangeClass = (change: number): string => {
  if (change > 0) return 'positive';
  if (change < 0) return 'negative';
  return 'neutral';
};

const getAccountAverage = (accountKey: string): number => {
  return (
    tableData.value.reduce((sum, record) => sum + (record.balances[accountKey] || 0), 0) /
      tableData.value.length || 0
  );
};

const getOverallAverage = (): number => {
  return (
    tableData.value.reduce((sum, record) => sum + record.totalBalance, 0) /
      tableData.value.length || 0
  );
};

const editNote = async (recordDate: string) => {
  const note = await storageService.getWeeklyNote(recordDate);

  notesForm.value = {
    recordDate,
    incomeNote: note?.incomeNote || '',
    expenseNote: note?.expenseNote || '',
  };

  showNotesModal.value = true;
};

const saveNotes = async () => {
  await storageService.saveWeeklyNote({
    recordDate: notesForm.value.recordDate,
    incomeNote: notesForm.value.incomeNote || undefined,
    expenseNote: notesForm.value.expenseNote || undefined,
  });

  closeNotesModal();
  await loadTableData();
};

const closeNotesModal = () => {
  showNotesModal.value = false;
  notesForm.value = {
    recordDate: '',
    incomeNote: '',
    expenseNote: '',
  };
};

const exportTable = () => {
  // 简化的导出功能
  const csvContent = generateCSV();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `资产记录_${formatWeekRange(selectedWeek.value)}.csv`;
  link.click();
};

const generateCSV = (): string => {
  const headers = [
    '记录时间',
    '建行',
    '工行',
    '广发',
    '现金',
    '支付宝',
    '微信',
    '基金股票',
    '合计',
    '变动（周）',
    '变动（4/5周）',
    '变动（季度）',
    '备注（支出）',
    '备注（收入）',
  ];

  const rows = tableData.value.map(record => [
    formatTime(record.recordDate),
    ...accountColumns.map(col => record.balances[col.key] || 0),
    record.totalBalance,
    record.weeklyChange,
    record.monthlyChange,
    record.quarterlyChange,
    record.expenseNote || '',
    record.incomeNote || '',
  ]);

  return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
};

onMounted(async () => {
  await loadAvailableWeeks();
  await loadTableData();
});
</script>

<style scoped>
.detailed-records-table {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.table-header h3 {
  margin: 0;
  color: #333;
}

.table-controls {
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

.table-container {
  overflow-x: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.detailed-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.detailed-table th,
.detailed-table td {
  padding: 12px 8px;
  text-align: right;
  border: 1px solid #e0e0e0;
}

.detailed-table th {
  background: #f5f7fa;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
}

.detailed-table th:first-child,
.detailed-table td:first-child {
  text-align: left;
  position: sticky;
  left: 0;
  background: inherit;
  z-index: 10;
}

.time-cell {
  font-weight: 500;
  position: relative;
}

.current-indicator {
  display: inline-block;
  background: #1976d2;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  margin-left: 8px;
}

.current-week {
  background: #e3f2fd !important;
}

.total-cell {
  font-weight: bold;
  font-size: 15px;
  color: #1976d2;
}

.change-cell {
  font-weight: 500;
  font-size: 13px;
}

.change-cell.positive {
  color: #2e7d32;
}

.change-cell.negative {
  color: #c62828;
}

.change-cell.neutral {
  color: #666;
}

.note-cell {
  text-align: left;
  cursor: pointer;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-style: italic;
  color: #666;
}

.note-cell:hover {
  background: #f5f5f5;
}

.expense-note {
  border-left: 3px solid #f44336;
}

.income-note {
  border-left: 3px solid #4caf50;
}

.summary-row {
  background: #f5f7fa;
  font-weight: bold;
}

.summary-cell,
.total-summary {
  font-weight: bold;
  color: #1976d2;
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

.notes-modal {
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.notes-modal h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #333;
}

.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
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

@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .table-controls {
    width: 100%;
    justify-content: flex-start;
  }

  .detailed-table {
    font-size: 12px;
  }

  .detailed-table th,
  .detailed-table td {
    padding: 8px 4px;
  }
}
</style>
