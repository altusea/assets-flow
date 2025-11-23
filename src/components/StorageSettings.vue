<template>
  <div class="storage-settings">
    <div class="settings-card">
      <h3>🗄️ 存储设置</h3>

      <div class="current-storage">
        <p><strong>当前存储方式：</strong>{{ getCurrentStorageLabel() }}</p>
      </div>

      <div class="storage-options">
        <h4>存储方式：</h4>
        <div class="option-group">
          <label class="radio-option">
            <input
              type="radio"
              value="drizzle-orm"
              v-model="selectedStorage"
              @change="handleStorageChange"
              checked
              disabled
            />
            <div class="option-content">
              <span class="option-title">Drizzle ORM + SQLite 数据库</span>
              <span class="option-desc">本地数据库，性能优秀，数据持久化</span>
            </div>
          </label>
        </div>
      </div>

      <div class="storage-info">
        <h4>存储信息</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">账户数量：</span>
            <span class="info-value">{{ accountCount }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">记录周数：</span>
            <span class="info-value">{{ weekCount }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">最后更新：</span>
            <span class="info-value">{{ lastUpdate }}</span>
          </div>
        </div>
      </div>

      <!-- 调试组件 -->
      <div class="debug-section">
        <h4>🔧 存储服务调试</h4>
        <DebugStorage />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { StorageFactory, type StorageType } from '../storage-factory';
import { storageService } from '../storage-factory';
import DebugStorage from './DebugStorage.vue';

const selectedStorage = ref<StorageType>('drizzle-orm');

const accountCount = ref(0);
const weekCount = ref(0);
const lastUpdate = ref('未知');

const getCurrentStorageLabel = () => {
  const labels = {
    'drizzle-orm': 'Drizzle ORM + SQLite 数据库',
  };
  return labels[selectedStorage.value || 'drizzle-orm'];
};

const loadStorageInfo = async () => {
  try {
    const accounts = await storageService.getAccounts();
    const weeks = await storageService.getAllWeeklySummaries();

    accountCount.value = accounts.length;
    weekCount.value = weeks.length;

    if (weeks.length > 0) {
      const latestWeek = weeks[0];
      lastUpdate.value = new Date(latestWeek.recordDate).toLocaleDateString('zh-CN');
    } else {
      lastUpdate.value = '暂无数据';
    }
  } catch (error) {
    console.error('Failed to load storage info:', error);
    lastUpdate.value = '加载失败';
  }
};

const handleStorageChange = async () => {
  if (!selectedStorage.value) return;

  try {
    await StorageFactory.switchStorage(selectedStorage.value);
    // 重新加载存储信息
    await loadStorageInfo();
  } catch (error) {
    console.error('Failed to switch storage:', error);
  }
};

onMounted(async () => {
  // 获取当前存储类型
  const currentType = StorageFactory.getCurrentStorageType();
  if (currentType) {
    selectedStorage.value = currentType;
  }

  // 加载存储信息
  await loadStorageInfo();
});
</script>

<style scoped>
.storage-settings {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.settings-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.settings-card h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 20px;
}

.settings-card h4 {
  margin: 20px 0 12px 0;
  color: #555;
  font-size: 16px;
}

.current-storage {
  background: #f8f9fa;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.current-storage p {
  margin: 0;
  color: #333;
}

.storage-options .option-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radio-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.radio-option:hover {
  border-color: #1976d2;
  background: #f8f9ff;
}

.radio-option input[type='radio'] {
  margin: 4px 0 0 0;
}

.radio-option .option-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.option-title {
  font-weight: 600;
  color: #333;
}

.option-desc {
  font-size: 14px;
  color: #666;
}

.storage-info {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e1e5e9;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.info-label {
  color: #666;
  font-size: 14px;
}

.info-value {
  color: #333;
  font-weight: 600;
}

@media (max-width: 768px) {
  .storage-settings {
    padding: 16px;
  }

  .settings-card {
    padding: 20px 16px;
  }

  .radio-option {
    padding: 12px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-color-scheme: dark) {
  .settings-card {
    background: #2a2a2a;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  }

  .settings-card h3,
  .settings-card h4 {
    color: #f5f7fa;
  }

  .current-storage {
    background: #3a3a3a;
  }

  .current-storage p {
    color: #f5f7fa;
  }

  .radio-option {
    border-color: #4a4a4a;
    background: #2a2a2a;
  }

  .radio-option:hover {
    border-color: #1976d2;
    background: #3a3a4a;
  }

  .option-title {
    color: #f5f7fa;
  }

  .option-desc {
    color: #ccc;
  }

  .migration-section {
    border-top-color: #4a4a4a;
  }

  .storage-info {
    border-top-color: #4a4a4a;
  }

  .info-label {
    color: #ccc;
  }

  .info-value {
    color: #f5f7fa;
  }
}
</style>
