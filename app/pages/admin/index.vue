<template>
  <div>
    
    
    <main style="padding: 2rem; max-width: 1200px; margin: 0 auto">
      <div v-if="!isAdmin">
        <h1>Access Denied</h1>
        <p>You don't have permission to access this page.</p>
      </div>

      <div v-else>
        <h1>Admin Dashboard</h1>

        <div v-if="loading">Loading statistics...</div>
        <div
          v-else-if="stats"
          style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
          ">
          <div
            style="border: 1px solid #ddd; padding: 2rem; text-align: center">
            <h2 style="margin: 0; color: #007bff">{{ stats.totalBadges }}</h2>
            <p style="margin: 0.5rem 0 0 0">Total Badges</p>
          </div>
          <div
            style="border: 1px solid #ddd; padding: 2rem; text-align: center">
            <h2 style="margin: 0; color: #28a745">
              {{ stats.totalUserBadges }}
            </h2>
            <p style="margin: 0.5rem 0 0 0">Awarded Badges</p>
          </div>
          <div
            style="border: 1px solid #ddd; padding: 2rem; text-align: center">
            <h2 style="margin: 0; color: #ffc107">
              {{ stats.pendingRequests }}
            </h2>
            <p style="margin: 0.5rem 0 0 0">Pending Requests</p>
          </div>
          <div
            style="border: 1px solid #ddd; padding: 2rem; text-align: center">
            <h2 style="margin: 0; color: #28a745">
              {{ stats.approvedRequests }}
            </h2>
            <p style="margin: 0.5rem 0 0 0">Approved Requests</p>
          </div>
          <div
            style="border: 1px solid #ddd; padding: 2rem; text-align: center">
            <h2 style="margin: 0; color: #dc3545">
              {{ stats.rejectedRequests }}
            </h2>
            <p style="margin: 0.5rem 0 0 0">Rejected Requests</p>
          </div>
          <div
            style="border: 1px solid #ddd; padding: 2rem; text-align: center">
            <h2 style="margin: 0; color: #6c757d">{{ stats.totalUsers }}</h2>
            <p style="margin: 0.5rem 0 0 0">Total Users</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem">
          <div>
            <h2>Popular Badges</h2>
            <div v-if="stats?.popularBadges?.length">
              <div
                v-for="badge in stats.popularBadges.slice(0, 5)"
                :key="badge._id"
                style="
                  border: 1px solid #eee;
                  padding: 1rem;
                  margin-bottom: 1rem;
                ">
                <h3>{{ badge.badge.name }}</h3>
                <p>{{ badge.badge.description }}</p>
                <p>
                  <strong>Awarded {{ badge.count }} times</strong>
                </p>
                <p><strong>Level:</strong> {{ badge.badge.level }}</p>
              </div>
            </div>
            <div v-else>No badge data available</div>
          </div>

          <div>
            <h2>Quick Actions</h2>
            <div style="display: flex; flex-direction: column; gap: 1rem">
              <NuxtLink
                to="/admin/users"
                style="
                  padding: 1rem;
                  background: #007bff;
                  color: white;
                  text-decoration: none;
                  text-align: center;
                ">
                Manage Users
              </NuxtLink>
              <NuxtLink
                to="/admin/badges"
                style="
                  padding: 1rem;
                  background: #28a745;
                  color: white;
                  text-decoration: none;
                  text-align: center;
                ">
                Manage Badges
              </NuxtLink>
              <NuxtLink
                to="/admin/badge-requests"
                style="
                  padding: 1rem;
                  background: #ffc107;
                  color: black;
                  text-decoration: none;
                  text-align: center;
                ">
                Review Badge Requests ({{
                  stats?.pendingRequests || 0
                }}
                pending)
              </NuxtLink>
            </div>
          </div>
        </div>

        <div v-if="stats?.topUsers?.length" style="margin-top: 3rem">
          <h2>Top Users</h2>
          <table style="width: 100%; border-collapse: collapse">
            <thead>
              <tr style="border-bottom: 2px solid #ddd">
                <th style="text-align: left; padding: 1rem">Name</th>
                <th style="text-align: left; padding: 1rem">GitHub</th>
                <th style="text-align: left; padding: 1rem">Role</th>
                <th style="text-align: left; padding: 1rem">Badges</th>
                <th style="text-align: left; padding: 1rem">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="user in stats.topUsers.slice(0, 10)"
                :key="user._id"
                style="border-bottom: 1px solid #eee">
                <td style="padding: 1rem">
                  {{ user.firstName }} {{ user.lastName }}
                </td>
                <td style="padding: 1rem">@{{ user.githubUsername }}</td>
                <td style="padding: 1rem">{{ user.role }}</td>
                <td style="padding: 1rem">{{ user.badgeCount }}</td>
                <td style="padding: 1rem">
                  <NuxtLink
                    :to="`/admin/users/${user.githubUsername}`"
                    style="text-decoration: none; color: #007bff">
                    Manage
                  </NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

  </div>
</template>

<script setup>
const stats = ref(null)
const loading = ref(true)
const currentUser = ref(null)

const isAdmin = computed(() => {
  return currentUser.value?.role === 'admin'
})

onMounted(async () => {
  await loadCurrentUser()
  if (isAdmin.value) {
    await loadStats()
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

async function loadStats() {
  try {
    const token = localStorage.getItem('authToken')
    const response = await $fetch('/api/admin/statistics', {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.data) {
      stats.value = response.data
    }
  } catch (error) {
    console.error('Failed to load stats:', error)
  } finally {
    loading.value = false
  }
}
</script>
