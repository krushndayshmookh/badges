<template>
  <div>
    <main style="padding: 2rem; max-width: 1200px; margin: 0 auto">
      <div v-if="!isAdmin">
        <h1>Access Denied</h1>
        <p>You don't have permission to access this page.</p>
      </div>

      <div v-else-if="loading">Loading user...</div>
      <div v-else-if="!user">User not found</div>

      <div v-else>
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
          "
        >
          <h1>Manage User: {{ user.firstName }} {{ user.lastName }}</h1>
          <NuxtLink
            to="/admin/users"
            style="padding: 0.5rem 1rem; background: #6c757d; color: white; text-decoration: none"
          >
            Back to Users
          </NuxtLink>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem">
          <!-- User Info & Actions -->
          <div>
            <div style="border: 1px solid #ddd; padding: 2rem; margin-bottom: 2rem">
              <h2>User Information</h2>
              <p>
                <strong>Name:</strong>
                {{ user.firstName }} {{ user.lastName }}
              </p>
              <p>
                <strong>GitHub:</strong>
                @{{ user.githubUsername }}
              </p>
              <p>
                <strong>Email:</strong>
                {{ user.email }}
              </p>
              <p>
                <strong>Role:</strong>
                <span
                  :style="{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    background: user.role === 'admin' ? '#dc3545' : '#28a745',
                    color: 'white',
                  }"
                >
                  {{ user.role }}
                </span>
              </p>
              <p>
                <strong>Total Badges:</strong>
                {{ user.badgeCount || 0 }}
              </p>

              <div
                v-if="
                  user.socialLinks &&
                  Object.keys(user.socialLinks).some(key => user.socialLinks[key])
                "
                style="margin-top: 1rem"
              >
                <h3>Social Links</h3>
                <div v-for="[platform, url] in Object.entries(user.socialLinks)" :key="platform">
                  <div v-if="url">
                    <strong>{{ platform.charAt(0).toUpperCase() + platform.slice(1) }}:</strong>
                    <a :href="url" target="_blank" style="color: #007bff">{{ url }}</a>
                  </div>
                </div>
              </div>
            </div>

            <!-- Role Management -->
            <div style="border: 1px solid #ddd; padding: 2rem; margin-bottom: 2rem">
              <h3>Role Management</h3>
              <div style="display: flex; gap: 1rem">
                <button
                  v-if="user.role === 'base'"
                  style="
                    padding: 0.5rem 1rem;
                    background: #dc3545;
                    color: white;
                    border: none;
                    cursor: pointer;
                  "
                  @click="changeRole('admin')"
                >
                  Promote to Admin
                </button>
                <button
                  v-if="user.role === 'admin' && user._id !== currentUser?._id"
                  style="
                    padding: 0.5rem 1rem;
                    background: #ffc107;
                    color: black;
                    border: none;
                    cursor: pointer;
                  "
                  @click="changeRole('base')"
                >
                  Demote to Base User
                </button>
                <span
                  v-if="user._id === currentUser?._id"
                  style="color: #6c757d; font-style: italic"
                >
                  Cannot change your own role
                </span>
              </div>
            </div>

            <!-- Award Badge -->
            <div style="border: 1px solid #ddd; padding: 2rem">
              <h3>Award Badge</h3>
              <form @submit.prevent="awardBadge">
                <div style="margin-bottom: 1rem">
                  <label style="display: block; margin-bottom: 0.5rem">Select Badge:</label>
                  <select
                    v-model="awardForm.badgeId"
                    required
                    style="width: 100%; padding: 0.5rem; border: 1px solid #ddd"
                  >
                    <option value="">Select a badge...</option>
                    <option v-for="badge in availableBadges" :key="badge._id" :value="badge._id">
                      {{ badge.name }} ({{ badge.level }})
                    </option>
                  </select>
                </div>
                <div style="margin-bottom: 1rem">
                  <label style="display: block; margin-bottom: 0.5rem">Notes (optional):</label>
                  <textarea
                    v-model="awardForm.notes"
                    style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; min-height: 80px"
                    placeholder="Add notes about this badge award..."
                  />
                </div>
                <button
                  type="submit"
                  :disabled="awardLoading"
                  style="
                    padding: 0.5rem 1rem;
                    background: #28a745;
                    color: white;
                    border: none;
                    cursor: pointer;
                  "
                >
                  {{ awardLoading ? 'Awarding...' : 'Award Badge' }}
                </button>
              </form>
            </div>
          </div>

          <!-- User Badges -->
          <div>
            <h2>User Badges</h2>
            <div v-if="loadingBadges">Loading badges...</div>
            <div v-else-if="userBadges.length === 0">No badges earned yet</div>
            <div v-else>
              <div
                v-for="userBadge in userBadges"
                :key="userBadge._id"
                style="border: 1px solid #ddd; padding: 1rem; margin-bottom: 1rem"
              >
                <div style="display: flex; justify-content: space-between; align-items: start">
                  <div>
                    <h3 style="margin: 0 0 0.5rem 0">
                      {{ userBadge.badge.name }}
                    </h3>
                    <p style="margin: 0 0 0.5rem 0">
                      {{ userBadge.badge.description }}
                    </p>
                    <p style="margin: 0 0 0.5rem 0">
                      <strong>Level:</strong>
                      {{ userBadge.badge.level }}
                    </p>
                    <p style="margin: 0 0 0.5rem 0">
                      <strong>Earned:</strong>
                      {{ new Date(userBadge.awardedAt).toLocaleDateString() }}
                    </p>
                    <p style="margin: 0">
                      <strong>Awarded by:</strong>
                      {{ userBadge.awardedBy?.firstName }}
                      {{ userBadge.awardedBy?.lastName }}
                    </p>
                    <p
                      v-if="userBadge.notes"
                      style="margin: 0.5rem 0 0 0; font-style: italic; color: #666"
                    >
                      Notes: {{ userBadge.notes }}
                    </p>
                  </div>
                  <button
                    style="
                      padding: 0.25rem 0.5rem;
                      background: #dc3545;
                      color: white;
                      border: none;
                      cursor: pointer;
                      font-size: 0.8rem;
                    "
                    @click="revokeBadge(userBadge)"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- User's Badge Requests -->
        <div style="margin-top: 3rem">
          <h2>Badge Requests</h2>
          <div v-if="loadingRequests">Loading requests...</div>
          <div v-else-if="badgeRequests.length === 0">No badge requests found</div>
          <div v-else>
            <table style="width: 100%; border-collapse: collapse">
              <thead>
                <tr style="border-bottom: 2px solid #ddd">
                  <th style="text-align: left; padding: 1rem">Badge</th>
                  <th style="text-align: left; padding: 1rem">Status</th>
                  <th style="text-align: left; padding: 1rem">Requested</th>
                  <th style="text-align: left; padding: 1rem">Reviewed By</th>
                  <th style="text-align: left; padding: 1rem">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="request in badgeRequests"
                  :key="request._id"
                  style="border-bottom: 1px solid #eee"
                >
                  <td style="padding: 1rem">{{ request.badge.name }}</td>
                  <td style="padding: 1rem">
                    <span
                      :style="{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        background:
                          request.status === 'approved'
                            ? '#28a745'
                            : request.status === 'rejected'
                            ? '#dc3545'
                            : '#ffc107',
                        color: request.status === 'pending' ? 'black' : 'white',
                        fontSize: '0.8rem',
                      }"
                    >
                      {{ request.status }}
                    </span>
                  </td>
                  <td style="padding: 1rem">
                    {{ new Date(request.requestedAt).toLocaleDateString() }}
                  </td>
                  <td style="padding: 1rem">
                    {{
                      request.reviewedBy
                        ? `${request.reviewedBy.firstName} ${request.reviewedBy.lastName}`
                        : '-'
                    }}
                  </td>
                  <td style="padding: 1rem">
                    <div v-if="request.status === 'pending'" style="display: flex; gap: 0.5rem">
                      <button
                        style="
                          padding: 0.25rem 0.5rem;
                          background: #28a745;
                          color: white;
                          border: none;
                          cursor: pointer;
                          font-size: 0.8rem;
                        "
                        @click="reviewRequest(request, 'approve')"
                      >
                        Approve
                      </button>
                      <button
                        style="
                          padding: 0.25rem 0.5rem;
                          background: #dc3545;
                          color: white;
                          border: none;
                          cursor: pointer;
                          font-size: 0.8rem;
                        "
                        @click="reviewRequest(request, 'reject')"
                      >
                        Reject
                      </button>
                    </div>
                    <span v-else style="color: #666; font-size: 0.8rem">{{ request.status }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
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
          border: messageType === 'error' ? '1px solid #f5c6cb' : '1px solid #c3e6cb',
        }"
      >
        {{ message }}
      </div>
    </main>
  </div>
</template>

<script setup>
  const route = useRoute()
  const githubUsername = route.params.githubUsername

  const user = ref(null)
  const userBadges = ref([])
  const badgeRequests = ref([])
  const availableBadges = ref([])
  const currentUser = ref(null)
  const loading = ref(true)
  const loadingBadges = ref(true)
  const loadingRequests = ref(true)
  const awardLoading = ref(false)
  const message = ref('')
  const messageType = ref('')

  const awardForm = ref({
    badgeId: '',
    notes: '',
  })

  const isAdmin = computed(() => {
    return currentUser.value?.role === 'admin'
  })

  onMounted(async () => {
    await loadCurrentUser()

    if (isAdmin.value) {
      await loadUser()
      loadUserBadges()
      loadUserBadgeRequests()
      loadAvailableBadges()
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

  async function loadUser() {
    try {
      const response = await $fetch(`/api/users/public?search=${githubUsername}`)
      const foundUser = response.data?.find(u => u.githubUsername === githubUsername)

      if (foundUser) {
        user.value = foundUser
      }
    } catch (error) {
      console.error('Failed to load user:', error)
    } finally {
      loading.value = false
    }
  }

  async function loadUserBadges() {
    if (!user.value) return

    try {
      const response = await $fetch(`/api/users/${user.value._id}/badges`)
      userBadges.value = response.data || []
    } catch (error) {
      console.error('Failed to load user badges:', error)
    } finally {
      loadingBadges.value = false
    }
  }

  async function loadUserBadgeRequests() {
    if (!user.value) return

    try {
      const token = localStorage.getItem('authToken')
      const response = await $fetch(`/api/badge-requests?user=${user.value._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      badgeRequests.value = response.data || []
    } catch (error) {
      console.error('Failed to load badge requests:', error)
    } finally {
      loadingRequests.value = false
    }
  }

  async function loadAvailableBadges() {
    try {
      const response = await $fetch('/api/badges')
      availableBadges.value = response.data || []
    } catch (error) {
      console.error('Failed to load badges:', error)
    }
  }

  async function changeRole(newRole) {
    try {
      const token = localStorage.getItem('authToken')
      const response = await $fetch(`/api/users/${user.value._id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: { role: newRole },
      })

      if (response.message) {
        showMessage(`User role changed to ${newRole}`, 'success')
        user.value.role = newRole
      }
    } catch (error) {
      console.error('Failed to change role:', error)
      showMessage(error.data?.error || 'Failed to change user role', 'error')
    }
  }

  async function awardBadge() {
    awardLoading.value = true
    try {
      const token = localStorage.getItem('authToken')
      const response = await $fetch(`/api/users/${user.value._id}/badges`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: awardForm.value,
      })

      if (response.message) {
        showMessage('Badge awarded successfully!', 'success')
        awardForm.value = { badgeId: '', notes: '' }
        await loadUserBadges() // Reload badges
        if (user.value.badgeCount !== undefined) {
          user.value.badgeCount++
        }
      }
    } catch (error) {
      console.error('Failed to award badge:', error)
      showMessage(error.data?.error || 'Failed to award badge', 'error')
    } finally {
      awardLoading.value = false
    }
  }

  async function revokeBadge(userBadge) {
    if (
      !confirm(
        `Are you sure you want to revoke the "${userBadge.badge.name}" badge from this user?`
      )
    ) {
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      const response = await $fetch(`/api/users/${user.value._id}/badges`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        body: { badgeId: userBadge.badge._id },
      })

      if (response.message) {
        showMessage('Badge revoked successfully!', 'success')
        await loadUserBadges() // Reload badges
        if (user.value.badgeCount !== undefined && user.value.badgeCount > 0) {
          user.value.badgeCount--
        }
      }
    } catch (error) {
      console.error('Failed to revoke badge:', error)
      showMessage(error.data?.error || 'Failed to revoke badge', 'error')
    }
  }

  async function reviewRequest(request, action) {
    try {
      const token = localStorage.getItem('authToken')
      const response = await $fetch(`/api/badge-requests/${request._id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: { action },
      })

      if (response.message) {
        showMessage(`Badge request ${action}d successfully!`, 'success')
        await Promise.all([
          loadUserBadgeRequests(),
          loadUserBadges(), // Reload in case it was approved
        ])

        if (action === 'approve' && user.value.badgeCount !== undefined) {
          user.value.badgeCount++
        }
      }
    } catch (error) {
      console.error(`Failed to ${action} request:`, error)
      showMessage(error.data?.error || `Failed to ${action} request`, 'error')
    }
  }

  function showMessage(msg, type) {
    message.value = msg
    messageType.value = type
    setTimeout(() => {
      message.value = ''
    }, 3000)
  }

  // Watch route changes
  watch(
    () => route.params.githubUsername,
    async newUsername => {
      if (newUsername && isAdmin.value) {
        loading.value = true
        loadingBadges.value = true
        loadingRequests.value = true
        await Promise.all([loadUser(), loadUserBadges(), loadUserBadgeRequests()])
      }
    }
  )
</script>
