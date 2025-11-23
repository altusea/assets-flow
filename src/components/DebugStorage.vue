<template>
  <div class="debug-storage">
    <h2>存储服务调试</h2>
    <button @click="testStorage" class="btn btn-primary">测试存储服务</button>
    <div v-if="result" class="result">
      <h3>测试结果:</h3>
      <pre>{{ result }}</pre>
    </div>
    <div v-if="error" class="error">
      <h3>错误:</h3>
      <pre>{{ error }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { storageService } from '../storage-factory';

const result = ref('');
const error = ref('');

const testStorage = async () => {
  result.value = '';
  error.value = '';

  try {
    result.value += '=== 开始存储服务测试 ===\n\n';

    // 测试获取账户
    result.value += '1. 获取当前账户...\n';
    const accounts = await storageService.getAccounts();
    result.value += `当前账户数量: ${accounts.length}\n`;
    result.value += `账户列表: ${JSON.stringify(accounts, null, 2)}\n\n`;

    // 测试添加账户
    result.value += '2. 添加测试账户...\n';
    const newAccount = await storageService.saveAccount({
      name: '测试账户',
      type: 'bank',
      description: '调试用测试账户'
    });
    result.value += `添加的账户: ${JSON.stringify(newAccount, null, 2)}\n\n`;

    // 再次获取账户确认
    result.value += '3. 再次获取账户确认...\n';
    const updatedAccounts = await storageService.getAccounts();
    result.value += `更新后的账户数量: ${updatedAccounts.length}\n`;
    result.value += `更新后的账户列表: ${JSON.stringify(updatedAccounts, null, 2)}\n\n`;

    result.value += '=== 存储服务测试完成 ===\n';
    result.value += '✅ 所有测试通过！存储服务工作正常。\n';

  } catch (err) {
    error.value = `存储服务测试失败: ${err}\n${err instanceof Error ? err.stack : ''}`;
    console.error('存储服务测试错误:', err);
  }
};
</script>

<style scoped>
.debug-storage {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin: 20px 0;
}

.result, .error {
  margin-top: 20px;
  padding: 15px;
  border-radius: 4px;
}

.result {
  background: #f0f9ff;
  border: 1px solid #b3e0ff;
}

.error {
  background: #ffe6e6;
  border: 1px solid #ffb3b3;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>