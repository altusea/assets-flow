<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { storageService } from '../storage-factory';
import { WeeklySummary, formatCurrency, formatDate } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const weeklySummaries = ref<WeeklySummary[]>([]);
const isLoading = ref(true);

// 图表数据
const chartData = computed(() => {
  const sortedSummaries = [...weeklySummaries.value].sort(
    (a, b) => new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime()
  );

  return {
    labels: sortedSummaries.map(summary => formatDate(summary.recordDate)),
    datasets: [
      {
        label: '总资金',
        data: sortedSummaries.map(summary => summary.totalBalance),
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  };
});

// 图表选项
const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: '总资金变化趋势',
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          return `总资金: ${formatCurrency(context.parsed.y || 0)}`;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: false,
      ticks: {
        callback: function (value) {
          return formatCurrency(Number(value));
        },
      },
    },
  },
};

// 加载数据
const loadData = async () => {
  try {
    isLoading.value = true;
    const summaries = await storageService.getAllWeeklySummaries();
    weeklySummaries.value = summaries || [];
  } catch (error) {
    console.error('加载统计数据失败:', error);
    weeklySummaries.value = [];
  } finally {
    isLoading.value = false;
  }
};

// 计算统计数据
const stats = computed(() => {
  if (weeklySummaries.value.length === 0) return null;

  const sorted = [...weeklySummaries.value].sort(
    (a, b) => new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime()
  );

  const latest = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];
  const oldest = sorted[0];

  const weeklyChange = previous ? latest.totalBalance - previous.totalBalance : 0;
  const totalChange = latest.totalBalance - oldest.totalBalance;

  return {
    currentTotal: latest.totalBalance,
    weeklyChange,
    totalChange,
    recordCount: sorted.length,
    startDate: oldest.recordDate,
    endDate: latest.recordDate,
  };
});

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="statistics-chart">
    <div class="chart-header">
      <h2>📈 资金统计</h2>
      <p class="chart-subtitle">总资金变化趋势分析</p>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards" v-if="stats">
      <div class="stat-card">
        <div class="stat-value">{{ formatCurrency(stats.currentTotal) }}</div>
        <div class="stat-label">当前总资金</div>
      </div>
      <div class="stat-card">
        <div
          class="stat-value"
          :class="{ positive: stats.weeklyChange > 0, negative: stats.weeklyChange < 0 }"
        >
          {{ stats.weeklyChange > 0 ? '+' : '' }}{{ formatCurrency(stats.weeklyChange) }}
        </div>
        <div class="stat-label">周变动</div>
      </div>
      <div class="stat-card">
        <div
          class="stat-value"
          :class="{ positive: stats.totalChange > 0, negative: stats.totalChange < 0 }"
        >
          {{ stats.totalChange > 0 ? '+' : '' }}{{ formatCurrency(stats.totalChange) }}
        </div>
        <div class="stat-label">总变动</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.recordCount }}</div>
        <div class="stat-label">记录周数</div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="chart-container">
      <div v-if="isLoading" class="loading">
        <div class="loading-spinner"></div>
        <p>加载数据中...</p>
      </div>
      <div v-else-if="weeklySummaries.length === 0" class="no-data">
        <p>暂无数据</p>
        <p class="no-data-hint">请先添加周记录以查看统计图表</p>
      </div>
      <div v-else class="chart-wrapper">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="data-table" v-if="weeklySummaries.length > 0">
      <h3>详细数据</h3>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>记录日期</th>
              <th>总资金</th>
              <th>账户数量</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="summary in [...weeklySummaries].sort(
                (a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime()
              )"
              :key="summary.recordDate"
            >
              <td>{{ formatDate(summary.recordDate) }}</td>
              <td>{{ formatCurrency(summary.totalBalance) }}</td>
              <td>{{ summary.accounts.length }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.statistics-chart {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.chart-header {
  text-align: center;
  margin-bottom: 32px;
}

.chart-header h2 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
}

.chart-subtitle {
  color: #666;
  font-size: 16px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.stat-value.positive {
  color: #2e7d32;
}

.stat-value.negative {
  color: #d32f2f;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.chart-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 32px;
  min-height: 400px;
}

.chart-wrapper {
  height: 400px;
}

.loading,
.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.no-data-hint {
  font-size: 14px;
  color: #999;
  margin-top: 8px;
}

.data-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.data-table h3 {
  margin-bottom: 16px;
  color: #333;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
}

tr:hover {
  background: #f8f9fa;
}

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  .statistics-chart {
    color: #f5f7fa;
  }

  .chart-header h2 {
    color: #f5f7fa;
  }

  .chart-subtitle {
    color: #ccc;
  }

  .stat-card {
    background: #2a2a2a;
    color: #f5f7fa;
  }

  .stat-value {
    color: #f5f7fa;
  }

  .stat-label {
    color: #ccc;
  }

  .chart-container,
  .data-table {
    background: #2a2a2a;
    color: #f5f7fa;
  }

  th {
    background: #3a3a3a;
    color: #f5f7fa;
  }

  th,
  td {
    border-bottom: 1px solid #444;
  }

  tr:hover {
    background: #3a3a3a;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .statistics-chart {
    padding: 16px;
  }

  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-value {
    font-size: 20px;
  }

  .chart-container {
    padding: 16px;
  }

  .chart-wrapper {
    height: 300px;
  }
}
</style>
