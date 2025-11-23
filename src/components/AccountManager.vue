<template>
  <div class="account-manager">
    <div class="header">
      <h2>账户管理</h2>
      <button @click="showAddForm = true" class="btn btn-primary">
        添加账户
      </button>
    </div>

    <!-- 账户列表 -->
    <div class="account-list">
      <div v-if="accounts.length === 0" class="empty-state">
        <p>暂无账户，请添加您的第一个账户</p>
      </div>
      <div v-else class="accounts">
        <div v-for="account in accounts" :key="account.id" class="account-card">
          <div class="account-info">
            <h3>{{ account.name }}</h3>
            <p class="account-type">{{ getAccountTypeLabel(account.type) }}</p>
            <p v-if="account.description" class="account-description">
              {{ account.description }}
            </p>
          </div>
          <div class="account-actions">
            <button @click="editAccount(account)" class="btn btn-secondary">
              编辑
            </button>
            <button @click="deleteAccount(account.id)" class="btn btn-danger">
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑账户弹窗 -->
    <div v-if="showAddForm || editingAccount" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <h3>{{ editingAccount ? '编辑账户' : '添加账户' }}</h3>
        <form @submit.prevent="saveAccount">
          <div class="form-group">
            <label for="name">账户名称 *</label>
            <input
              id="name"
              v-model="formData.name"
              type="text"
              required
              placeholder="例如：招商银行储蓄卡"
            />
          </div>

          <div class="form-group">
            <label for="type">账户类型 *</label>
            <select id="type" v-model="formData.type" required>
              <option value="bank">银行卡</option>
              <option value="cash">现金</option>
              <option value="stock">股票</option>
              <option value="other">其他</option>
            </select>
          </div>

          <div class="form-group">
            <label for="description">描述</label>
            <textarea
              id="description"
              v-model="formData.description"
              placeholder="可选，例如：工资卡、日常消费等"
              rows="3"
            ></textarea>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              {{ editingAccount ? '保存修改' : '添加账户' }}
            </button>
            <button type="button" @click="closeModal" class="btn btn-secondary">
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { storageService } from '../storage-factory';
import type { Account } from '../types';
import { getAccountTypeLabel } from '../types';

const accounts = ref<Account[]>([]);
const showAddForm = ref(false);
const editingAccount = ref<Account | null>(null);

const formData = ref({
  name: '',
  type: 'bank' as Account['type'],
  description: ''
});

const loadAccounts = async () => {
  accounts.value = await storageService.getAccounts();
};

const saveAccount = async () => {
  if (editingAccount.value) {
    await storageService.updateAccount(editingAccount.value.id, formData.value);
  } else {
    await storageService.saveAccount(formData.value);
  }

  closeModal();
  await loadAccounts();
};

const editAccount = (account: Account) => {
  editingAccount.value = account;
  formData.value = {
    name: account.name,
    type: account.type,
    description: account.description || ''
  };
};

const deleteAccount = async (accountId: string) => {
  if (confirm('确定要删除这个账户吗？删除后将同时删除相关的所有余额记录。')) {
    await storageService.deleteAccount(accountId);
    await loadAccounts();
  }
};

const closeModal = () => {
  showAddForm.value = false;
  editingAccount.value = null;
  formData.value = {
    name: '',
    type: 'bank',
    description: ''
  };
};

onMounted(() => {
  loadAccounts();
});
</script>

<style scoped>
.account-manager {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h2 {
  margin: 0;
  color: #333;
}

.account-list {
  margin-top: 20px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
  background: #f9f9f9;
  border-radius: 8px;
}

.accounts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.account-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.account-info h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 18px;
}

.account-type {
  display: inline-block;
  background: #e3f2fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-bottom: 8px;
}

.account-description {
  color: #666;
  font-size: 14px;
  margin: 8px 0 0 0;
}

.account-actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.modal h3 {
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

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
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

.btn-danger {
  background: #d32f2f;
  color: white;
}

.btn-danger:hover {
  background: #c62828;
}
</style>