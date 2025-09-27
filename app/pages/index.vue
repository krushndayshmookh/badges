<template>
  <div>
    
    
    <main style="padding: 2rem; max-width: 1200px; margin: 0 auto;">
      <h1>NST SDC Badges System</h1>
      <p>Welcome to the NST Software Development Community Badge System!</p>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem;">
        <div>
          <h2>Recent Badges</h2>
          <div v-if="loading">Loading badges...</div>
          <div v-else-if="badges.length === 0">No badges found</div>
          <div v-else>
            <div v-for="badge in badges.slice(0, 5)" :key="badge._id" style="border: 1px solid #ddd; padding: 1rem; margin-bottom: 1rem;">
              <h3>{{ badge.name }}</h3>
              <p>{{ badge.description }}</p>
              <!-- <p><strong>Level:</strong> {{ badge.level }}</p> -->
              <!-- <NuxtLink :to="`/badges/${badge._id}`" style="text-decoration: none; color: #007bff;">
                View Details
              </NuxtLink> -->

              <!-- <button @click="claimBadge(badge._id)" style="padding: 0.5rem 1rem; background: #28a745; color: white; border: none; cursor: pointer;"> -->

            </div>
          </div>
        </div>
        
        <div>
          <h2>Top Users</h2>
          <div v-if="loadingUsers">Loading users...</div>
          <div v-else-if="topUsers.length === 0">No users found</div>
          <div v-else>
            <div v-for="user in topUsers.slice(0, 5)" :key="user._id" style="border: 1px solid #ddd; padding: 1rem; margin-bottom: 1rem;">
              <h3>{{ user.firstName }} {{ user.lastName }}</h3>
              <p><strong>GitHub:</strong> @{{ user.githubUsername }}</p>
              <p><strong>Badges:</strong> {{ user.badgeCount }}</p>
              <NuxtLink :to="`/users/${user.githubUsername}`" style="text-decoration: none; color: #007bff;">
                View Profile
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </main>
    
  </div>
</template>

<script setup>
const badges = ref([])
const topUsers = ref([])
const loading = ref(true)
const loadingUsers = ref(true)

onMounted(async () => {
  await Promise.all([loadBadges(), loadTopUsers()])
})

async function loadBadges() {
  try {
    const response = await $fetch('/api/badges?limit=5')
    badges.value = response.data || []
  } catch (error) {
    console.error('Failed to load badges:', error)
  } finally {
    loading.value = false
  }
}

async function loadTopUsers() {
  try {
    const response = await $fetch('/api/users/public?limit=5')
    topUsers.value = response.data || []
  } catch (error) {
    console.error('Failed to load top users:', error)
  } finally {
    loadingUsers.value = false
  }
}
</script>
