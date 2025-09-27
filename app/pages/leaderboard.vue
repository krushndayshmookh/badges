<template>
  <div>
    
    
    <main style="padding: 2rem; max-width: 1200px; margin: 0 auto;">
      <h1>Leaderboard</h1>
      
      <div style="margin-bottom: 2rem;">
        <input 
          v-model="searchQuery" 
          type="text"
          placeholder="Search users..." 
          style="padding: 0.5rem; border: 1px solid #ddd; width: 300px; margin-right: 1rem;" 
          @input="debouncedSearch"
        >
        <button style="padding: 0.5rem 1rem; background: #007bff; color: white; border: none; cursor: pointer;" @click="loadUsers">
          Search
        </button>
      </div>
      
      <div v-if="loading">Loading users...</div>
      <div v-else-if="users.length === 0">No users found</div>
      <div v-else>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #ddd;">
              <th style="text-align: left; padding: 1rem;">Rank</th>
              <th style="text-align: left; padding: 1rem;">Name</th>
              <th style="text-align: left; padding: 1rem;">GitHub</th>
              <th style="text-align: left; padding: 1rem;">Badges</th>
              <th style="text-align: left; padding: 1rem;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, index) in users" :key="user._id" style="border-bottom: 1px solid #eee;">
              <td style="padding: 1rem;">{{ (currentPage - 1) * 20 + index + 1 }}</td>
              <td style="padding: 1rem;">{{ user.firstName }} {{ user.lastName }}</td>
              <td style="padding: 1rem;">@{{ user.githubUsername }}</td>
              <td style="padding: 1rem;">{{ user.badgeCount }}</td>
              <td style="padding: 1rem;">
                <NuxtLink :to="`/users/${user.githubUsername}`" style="text-decoration: none; color: #007bff;">
                  View Profile
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div style="margin-top: 2rem; display: flex; justify-content: space-between; align-items: center;">
          <button 
            :disabled="currentPage === 1" 
            style="padding: 0.5rem 1rem; background: #007bff; color: white; border: none; cursor: pointer;"
            :style="{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }"
            @click="previousPage"
          >
            Previous
          </button>
          
          <span>Page {{ currentPage }} of {{ totalPages }}</span>
          
          <button 
            :disabled="currentPage >= totalPages" 
            style="padding: 0.5rem 1rem; background: #007bff; color: white; border: none; cursor: pointer;"
            :style="{ opacity: currentPage >= totalPages ? 0.5 : 1, cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer' }"
            @click="nextPage"
          >
            Next
          </button>
        </div>
      </div>
    </main>
    
  </div>
</template>

<script setup>
const users = ref([])
const loading = ref(true)
const searchQuery = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const limit = 20

let searchTimeout = null

onMounted(async () => {
  await loadUsers()
})

const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadUsers()
  }, 500)
}

async function loadUsers() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: limit.toString()
    })
    
    if (searchQuery.value.trim()) {
      params.append('search', searchQuery.value.trim())
    }
    
    const response = await $fetch(`/api/users/public?${params.toString()}`)
    users.value = response.data || []
    totalPages.value = response.pagination?.pages || 1
  } catch (error) {
    console.error('Failed to load users:', error)
    users.value = []
  } finally {
    loading.value = false
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
</script>