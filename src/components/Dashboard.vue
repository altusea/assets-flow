<template>
  <div class="dashboard">
    <!-- 总览卡片 -->
    <div class="overview-cards">
      <div class="card total-assets">
        <div class="card-icon">💰</div>
        <div class="card-content">
          <div class="card-title">总资产</div>
          <div class="card-value">{{ formatCurrency(latestTotalBalance) }}</div>
          <div class="card-trend" v-if="balanceTrend !== 0">
            {{ getTrendText(balanceTrend) }}
          </div>
        </div>
      </div>

      <div class="card accounts-count">
        <div class="card-icon">🏦</div>
        <div class="card-content">
          <div class="card-title">账户数量</div>
          <div class="card-value">{{ accounts.length }}</div>
        </div>
      </div>

      <div class="card weeks-count">
        <div class="card-icon">📅</div>
        <div class="card-content">
          <div class="card-title">记录周数</div>
          <div class="card-value">{{ history.length }}</div>
        </div>
      </div>
    </div>

    <!-- 资产分布图表 -->
    <div class="chart-section">
      <h3>资产分布</h3>
      <div v-if="latestSummary && latestSummary.accounts.length > 0" class="chart-container">
        <div class="pie-chart">
          <div
            v-for="(account, index) in chartData"
            :key="account.accountId"
            class="chart-segment"
            :style="{
              background: getSegmentColor(index),
              transform: `rotate(${account.startAngle}deg) skewY(${account.angle}deg)`,
              zIndex: chartData.length - index,
            }"
          ></div>
        </div>
        <div class="chart-legend">
          <div
            v-for="(account, index) in latestSummary.accounts"
            :key="account.accountId"
            class="legend-item"
          >
            <div class="legend-color" :style="{ background: getSegmentColor(index) }"></div>
            <div class="legend-info">
              <span class="legend-name">{{ account.accountName }}</span>
              <span class="legend-value">{{ formatCurrency(account.balance) }}</span>
              <span class="legend-percent">{{ getPercentage(account.balance) }}%</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-chart">
        <p>暂无数据</p>
      </div>
    </div>

    <!-- 最近记录 -->
    <div class="recent-records">
      <h3>最近记录</h3>
      <div v-if="history.length > 0" class="records-list">
        <div v-for="record in history.slice(0, 5)" :key="record.recordDate" class="record-item">
          <div class="record-week">{{ formatWeekRange(record.recordDate) }}</div>
          <div class="record-total">{{ formatCurrency(record.totalBalance) }}</div>
          <div class="record-change" v-if="getWeeklyChange(record) !== 0">
            {{ formatChange(getWeeklyChange(record)) }}
          </div>
        </div>
      </div>
      <div v-else class="empty-records">
        <p>暂无记录</p>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="quick-actions">
      <h3>快速操作</h3>
      <div class="action-buttons">
        <button @click="$emit('add-record')" class="action-btn record-btn">
          <span class="action-icon">📝</span>
          <span>记录余额</span>
        </button>
        <button @click="$emit('manage-accounts')" class="action-btn account-btn">
          <span class="action-icon">🏦</span>
          <span>管理账户</span>
        </button>
        <button @click="$emit('view-history')" class="action-btn history-btn">
          <span class="action-icon">📊</span>
          <span>查看历史</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { storageService } from '../storage-factory';
import { formatCurrency } from '../types';
import type { WeeklySummary } from '../types';

const accounts = ref<any[]>([]);
const history = ref<WeeklySummary[]>([]);

const latestSummary = computed(() => history.value[0] || null);
const latestTotalBalance = computed(() => latestSummary.value?.totalBalance || 0);

const balanceTrend = computed(() => {
  if (history.value.length < 2) return 0;
  const current = latestTotalBalance.value;
  const previous = history.value[1].totalBalance;
  return current - previous;
});

const chartData = computed(() => {
  if (!latestSummary.value || latestSummary.value.totalBalance === 0) return [];

  const total = latestSummary.value.totalBalance;
  let currentAngle = 0;

  return latestSummary.value.accounts.map(account => {
    const percentage = (account.balance / total) * 100;
    const angle = (percentage / 100) * 360;
    const segment = {
      ...account,
      percentage,
      angle,
      startAngle: currentAngle,
    };
    currentAngle += angle;
    return segment;
  });
});

const loadData = async () => {
  accounts.value = await storageService.getAccounts();
  history.value = await storageService.getAllWeeklySummaries();
};

const getTrendText = (change: number): string => {
  if (change > 0) {
    return `↗️ +${formatCurrency(Math.abs(change))}`;
  } else if (change < 0) {
    return `📉 -${formatCurrency(Math.abs(change))}`;
  }
  return '';
};

const getPercentage = (value: number): string => {
  if (latestTotalBalance.value === 0) return '0';
  return ((value / latestTotalBalance.value) * 100).toFixed(1);
};

const getWeeklyChange = (record: WeeklySummary): number => {
  const index = history.value.findIndex(r => r.recordDate === record.recordDate);
  if (index === -1 || index === history.value.length - 1) return 0;

  const current = record.totalBalance;
  const next = history.value[index + 1].totalBalance;
  return current - next;
};

const formatChange = (change: number): string => {
  const prefix = change > 0 ? '+' : '';
  return `${prefix}${formatCurrency(Math.abs(change))}`;
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

const getSegmentColor = (index: number): string => {
  const colors = [
    '#FF6B6B',
    '#4ECDC4',
    '#45B7D1',
    '#96CEB4',
    '#FFEAA7',
    '#DDA0DD',
    '#98D8C8',
    '#F7DC6F',
    '#85C1E9',
    '#F8B739',
  ];
  return colors[index % colors.length];
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-icon {
  font-size: 2rem;
  background: #f5f5f5;
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-content {
  flex: 1;
}

.card-title {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.card-trend {
  font-size: 14px;
  color: #666;
}

.chart-section,
.recent-records,
.quick-actions {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.chart-section h3,
.recent-records h3,
.quick-actions h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.chart-container {
  display: flex;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
}

.pie-chart {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: #f5f5f5;
  overflow: hidden;
}

.chart-segment {
  position: absolute;
  width: 100%;
  height: 100%;
  transform-origin: 50% 50%;
}

.chart-legend {
  flex: 1;
  min-width: 200px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
}

.legend-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.legend-name {
  font-size: 14px;
  color: #333;
}

.legend-value {
  font-size: 16px;
  font-weight: bold;
  color: #1976d2;
}

.legend-percent {
  font-size: 12px;
  color: #666;
}

.empty-chart {
  text-align: center;
  padding: 40px;
  color: #666;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  border-left: 4px solid #1976d2;
}

.record-week {
  flex: 1;
  font-weight: 500;
  color: #333;
}

.record-total {
  flex: 1;
  text-align: center;
  font-weight: bold;
  color: #1976d2;
}

.record-change {
  flex: 1;
  text-align: right;
  font-weight: 500;
}

.record-change[style*='color'] {
  color: #666;
}

.empty-records {
  text-align: center;
  padding: 40px;
  color: #666;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 16px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
}

.record-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.record-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.account-btn {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.account-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(240, 147, 251, 0.4);
}

.history-btn {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.history-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.4);
}

.action-icon {
  font-size: 2rem;
}

@media (max-width: 768px) {
  .overview-cards {
    grid-template-columns: 1fr;
  }

  .chart-container {
    flex-direction: column;
    text-align: center;
  }

  .action-buttons {
    grid-template-columns: 1fr;
  }
}
</style>
