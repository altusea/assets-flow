<script setup lang="ts">
import { ref, onMounted } from "vue";
import Dashboard from "./components/Dashboard.vue";
import AccountManager from "./components/AccountManager.vue";
import WeeklyRecordManager from "./components/WeeklyRecordManager.vue";
import DetailedRecordsTable from "./components/DetailedRecordsTable.vue";
import StorageSettings from "./components/StorageSettings.vue";
import StatisticsChart from "./components/StatisticsChart.vue";
import { storageService } from "./storage-factory";

const currentView = ref<'dashboard' | 'accounts' | 'records' | 'table' | 'settings' | 'statistics'>('dashboard');

const navigateTo = (view: typeof currentView.value) => {
  currentView.value = view;
};

const initializeApp = async () => {
  // 初始化示例数据（仅在没有数据时）
  await storageService.initializeSampleData();
};

onMounted(() => {
  initializeApp();
});
</script>

<template>
  <div class="app">
    <!-- 导航栏 -->
    <nav class="navbar">
      <div class="nav-brand">
        <h1>💰 资产记账</h1>
      </div>
      <div class="nav-menu">
        <button
          @click="navigateTo('dashboard')"
          :class="['nav-btn', { active: currentView === 'dashboard' }]"
        >
          📊 总览
        </button>
        <button
          @click="navigateTo('records')"
          :class="['nav-btn', { active: currentView === 'records' }]"
        >
          📝 记录
        </button>
        <button
          @click="navigateTo('table')"
          :class="['nav-btn', { active: currentView === 'table' }]"
        >
          📋 表格
        </button>
        <button
          @click="navigateTo('statistics')"
          :class="['nav-btn', { active: currentView === 'statistics' }]"
        >
          📈 统计
        </button>
        <button
          @click="navigateTo('accounts')"
          :class="['nav-btn', { active: currentView === 'accounts' }]"
        >
          🏦 账户
        </button>
        <button
          @click="navigateTo('settings')"
          :class="['nav-btn', { active: currentView === 'settings' }]"
        >
          ⚙️ 设置
        </button>
      </div>
    </nav>

    <!-- 主内容区 -->
    <main class="main-content">
      <Dashboard
        v-if="currentView === 'dashboard'"
        @add-record="navigateTo('records')"
        @manage-accounts="navigateTo('accounts')"
        @view-history="navigateTo('records')"
      />
      <WeeklyRecordManager v-else-if="currentView === 'records'" />
      <DetailedRecordsTable v-else-if="currentView === 'table'" />
      <StatisticsChart v-else-if="currentView === 'statistics'" />
      <AccountManager v-else-if="currentView === 'accounts'" />
      <StorageSettings v-else-if="currentView === 'settings'" />
    </main>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  font-size: 16px;
  line-height: 1.5;
  font-weight: 400;

  color: #333;
  background-color: #f5f7fa;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  background-color: #f5f7fa;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 64px;
}

.nav-brand h1 {
  font-size: 20px;
  color: #333;
  margin: 0;
}

.nav-menu {
  display: flex;
  gap: 8px;
}

.nav-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #666;
  cursor: pointer;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: #f5f7fa;
  color: #333;
}

.nav-btn.active {
  background: #1976d2;
  color: white;
}

.main-content {
  flex: 1;
  min-height: calc(100vh - 64px);
}

@media (max-width: 768px) {
  .navbar {
    padding: 0 16px;
    flex-direction: column;
    height: auto;
    padding-top: 12px;
    padding-bottom: 12px;
  }

  .nav-brand h1 {
    font-size: 18px;
    margin-bottom: 8px;
  }

  .main-content {
    min-height: calc(100vh - 88px);
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    color: #f5f7fa;
    background-color: #1a1a1a;
  }

  body {
    background-color: #1a1a1a;
  }

  .navbar {
    background: #2a2a2a;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  .nav-brand h1 {
    color: #f5f7fa;
  }

  .nav-btn {
    color: #ccc;
  }

  .nav-btn:hover {
    background: #3a3a3a;
    color: #f5f7fa;
  }

  .nav-btn.active {
    background: #1976d2;
    color: white;
  }
}
</style>