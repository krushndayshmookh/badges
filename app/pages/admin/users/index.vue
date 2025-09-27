<template>
  <div>
    
    
    <main style="padding: 2rem; max-width: 1200px; margin: 0 auto">
      <div v-if="!isAdmin">
        <h1>Access Denied</h1>
        <p>You don't have permission to access this page.</p>
      </div>

      <div v-else>
        <h1>User Management</h1>

        <div
          style="
            margin-bottom: 2rem;
            display: flex;
            gap: 1rem;
            align-items: center;
          ">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search users..."
            style="padding: 0.5rem; border: 1px solid #ddd; width: 300px" >
          <button
            style="
              padding: 0.5rem 1rem;
              background: #007bff;
              color: white;
              border: none;
              cursor: pointer;
            "
            @click="loadUsers">
            Search
          </button>
          <select
            v-model="roleFilter"
            style="padding: 0.5rem; border: 1px solid #ddd"
            @change="loadUsers">
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="base">Base User</option>
          </select>
        </div>

        <div v-if="loading">Loading users...</div>
        <div v-else-if="users.length === 0">No users found</div>
        <div v-else>
          <table style="width: 100%; border-collapse: collapse">
            <thead>
              <tr style="border-bottom: 2px solid #ddd">
                <th style="text-align: left; padding: 1rem">Name</th>
                <th style="text-align: left; padding: 1rem">GitHub</th>
                <th style="text-align: left; padding: 1rem">Email</th>
                <th style="text-align: left; padding: 1rem">Role</th>
                <th style="text-align: left; padding: 1rem">Badges</th>
                <th style="text-align: left; padding: 1rem">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="user in users"
                :key="user._id"
                style="border-bottom: 1px solid #eee">
                <td style="padding: 1rem">
                  {{ user.firstName }} {{ user.lastName }}
                </td>
                <td style="padding: 1rem">@{{ user.githubUsername }}</td>
                <td style="padding: 1rem">{{ user.email }}</td>
                <td style="padding: 1rem">
                  <span
                    :style="{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      background: user.role === 'admin' ? '#dc3545' : '#28a745',
                      color: 'white',
                      fontSize: '0.8rem',
                    }">
                    {{ user.role }}
                  </span>
                </td>
                <td style="padding: 1rem">{{ user.badgeCount || 0 }}</td>
                <td style="padding: 1rem">
                  <div style="display: flex; gap: 0.5rem">
                    <NuxtLink
                      :to="`/admin/users/${user.githubUsername}`"
                      style="
                        padding: 0.25rem 0.5rem;
                        background: #007bff;
                        color: white;
                        text-decoration: none;
                        font-size: 0.8rem;
                      ">
                      Manage
                    </NuxtLink>
                    <button
                      v-if="
                        user.role === 'base' && user._id !== currentUser?._id
                      "
                      style="
                        padding: 0.25rem 0.5rem;
                        background: #dc3545;
                        color: white;
                        border: none;
                        cursor: pointer;
                        font-size: 0.8rem;
                      "
                      @click="changeRole(user, 'admin')">
                      Make Admin
                    </button>
                    <button
                      v-if="
                        user.role === 'admin' && user._id !== currentUser?._id
                      "
                      style="
                        padding: 0.25rem 0.5rem;
                        background: #ffc107;
                        color: black;
                        border: none;
                        cursor: pointer;
                        font-size: 0.8rem;
                      "
                      @click="changeRole(user, 'base')">
                      Remove Admin
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div
            style="
              margin-top: 2rem;
              display: flex;
              justify-content: space-between;
              align-items: center;
            ">
            <button
              :disabled="currentPage === 1"
              style="
                padding: 0.5rem 1rem;
                background: #007bff;
                color: white;
                border: none;
                cursor: pointer;
              "
              :style="{
                opacity: currentPage === 1 ? 0.5 : 1,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              }"
              @click="previousPage">
              Previous
            </button>

            <span>Page {{ currentPage }} of {{ totalPages }}</span>

            <button
              :disabled="currentPage >= totalPages"
              style="
                padding: 0.5rem 1rem;
                background: #007bff;
                color: white;
                border: none;
                cursor: pointer;
              "
              :style="{
                opacity: currentPage >= totalPages ? 0.5 : 1,
                cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
              }"
              @click="nextPage">
              Next
            </button>
          </div>
        </div>
      </div>

      <!-- Messages -->
      <div
        v-if="message"
        style="
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 1rem;
          border-radius: 4px;
          z-index: 1000;
        "
        :style="{
          background: messageType === 'error' ? '#f8d7da' : '#d4edda',
          color: messageType === 'error' ? '#721c24' : '#155724',
          border:
            messageType === 'error' ? '1px solid #f5c6cb' : '1px solid #c3e6cb',
        }">
        {{ message }}
      </div>
    </main>

 
  </div>
</template>

<script setup>
const users = ref([])
const loading = ref(true)
const currentUser = ref(null)
const searchQuery = ref('')
const roleFilter = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const message = ref('')
const messageType = ref('')
const limit = 20

const isAdmin = computed(() => {
  return currentUser.value?.role === 'admin'
})

onMounted(async () => {
  await loadCurrentUser()
  if (isAdmin.value) {
    await loadUsers()
  }
})

async function loadCurrentUser() {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      navigateTo('/auth')
      return
    }

    const response = await $fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.data) {
      currentUser.value = response.data
    } else {
      navigateTo('/auth')
    }
  } catch (error) {
    console.error('Failed to load current user:', error)
    navigateTo('/auth')
  }
}

async function loadUsers() {
  loading.value = true
  try {
    const token = localStorage.getItem('authToken')
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: limit.toString(),
    })

    if (searchQuery.value.trim()) {
      params.append('search', searchQuery.value.trim())
    }

    if (roleFilter.value) {
      params.append('role', roleFilter.value)
    }

    const response = await $fetch(`/api/users?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    users.value = response.data || []
    totalPages.value = response.pagination?.pages || 1
  } catch (error) {
    console.error('Failed to load users:', error)
    users.value = []
    showMessage('Failed to load users', 'error')
  } finally {
    loading.value = false
  }
}

async function changeRole(user, newRole) {
  try {
    const token = localStorage.getItem('authToken')
    const response = await $fetch(`/api/users/${user._id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: { role: newRole },
    })

    if (response.message) {
      showMessage(`User role changed to ${newRole}`, 'success')
      await loadUsers() // Reload to show updated role
    }
  } catch (error) {
    console.error('Failed to change role:', error)
    showMessage(error.data?.error || 'Failed to change user role', 'error')
  }
}

function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    loadUsers()
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    loadUsers()
  }
}

function showMessage(msg, type) {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 3000)
}
</script>
