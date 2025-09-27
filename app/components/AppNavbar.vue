<template>
  <nav style="border-bottom: 1px solid #ddd; padding: 1rem; margin-bottom: 2rem;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <NuxtLink to="/" style="margin-right: 1rem; text-decoration: none;">Home</NuxtLink>
        <NuxtLink to="/leaderboard" style="margin-right: 1rem; text-decoration: none;">Leaderboard</NuxtLink>
      </div>
      <div>
        <div v-if="user">
          <NuxtLink :to="`/users/${user.githubUsername}`" style="margin-right: 1rem; text-decoration: none;">
            {{ user.firstName }}
          </NuxtLink>
          <button style="background: #dc3545; color: white; border: none; padding: 0.5rem 1rem; cursor: pointer;" @click="logout">
            Logout
          </button>
        </div>
        <div v-else>
          <NuxtLink to="/auth" style="text-decoration: none; background: #007bff; color: white; padding: 0.5rem 1rem;">
            Login
          </NuxtLink>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
const user = ref(null)

onMounted(async () => {
  await checkAuthStatus()
})

async function checkAuthStatus() {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) return
    
    const response = await $fetch('/api/users/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    if (response.data) {
      user.value = response.data
    }
  } catch (error) {
    console.error('Auth check failed:', error)
    localStorage.removeItem('authToken')
  }
}

function logout() {
  localStorage.removeItem('authToken')
  user.value = null
  navigateTo('/auth')
}
</script>