<template>
  <footer style="border-top: 1px solid #ddd; padding: 1rem; margin-top: 2rem; text-align: center;">
    <div v-if="!user">
      <NuxtLink to="/admin" style="text-decoration: none; color: #666;">Admin Panel</NuxtLink>
    </div>
    <div v-else-if="user?.role === 'admin'">
      <NuxtLink to="/admin" style="text-decoration: none; color: #666;">Admin Panel</NuxtLink>
    </div>
    <p style="margin-top: 1rem; color: #999; font-size: 0.9rem;">NST SDC Badges System</p>
  </footer>
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
  }
}
</script>