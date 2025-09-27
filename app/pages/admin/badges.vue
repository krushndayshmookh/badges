<template>
  <div>
    
    
    <main style="padding: 2rem; max-width: 1200px; margin: 0 auto">
      <div v-if="!isAdmin">
        <h1>Access Denied</h1>
        <p>You don't have permission to access this page.</p>
      </div>

      <div v-else>
        <h1>Badge Management</h1>

        <!-- Create New Badge Form -->
        <div style="border: 1px solid #ddd; padding: 2rem; margin-bottom: 2rem">
          <h2>Create New Badge</h2>
          <form @submit.prevent="createBadge">
            <div
              style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem">
              <div>
                <label style="display: block; margin-bottom: 0.5rem"
                  >Badge Name:</label
                >
                <input
                  v-model="createForm.name"
                  type="text"
                  required
                  style="
                    width: 100%;
                    padding: 0.5rem;
                    border: 1px solid #ddd;
                  " >
              </div>
              <div>
                <label style="display: block; margin-bottom: 0.5rem"
                  >Level:</label
                >
                <select
                  v-model="createForm.level"
                  required
                  style="width: 100%; padding: 0.5rem; border: 1px solid #ddd">
                  <option value="">Select level...</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            </div>

            <div style="margin-top: 1rem">
              <label style="display: block; margin-bottom: 0.5rem"
                >Description:</label
              >
              <textarea
                v-model="createForm.description"
                required
                style="
                  width: 100%;
                  padding: 0.5rem;
                  border: 1px solid #ddd;
                  min-height: 80px;
                "
                placeholder="Describe what this badge represents..." />
            </div>

            <div style="margin-top: 1rem; display: flex; gap: 1rem">
              <div style="flex: 1">
                <label style="display: block; margin-bottom: 0.5rem"
                  >Image URL (optional):</label
                >
                <input
                  v-model="createForm.imageUrl"
                  type="url"
                  style="width: 100%; padding: 0.5rem; border: 1px solid #ddd"
                  placeholder="https://example.com/badge-image.png" >
              </div>
              <div style="flex: 1">
                <label style="display: block; margin-bottom: 0.5rem"
                  >Category (optional):</label
                >
                <input
                  v-model="createForm.category"
                  type="text"
                  style="width: 100%; padding: 0.5rem; border: 1px solid #ddd"
                  placeholder="e.g., Frontend, Backend, DevOps" >
              </div>
            </div>

            <button
              type="submit"
              :disabled="createLoading"
              style="
                margin-top: 1rem;
                padding: 0.5rem 2rem;
                background: #28a745;
                color: white;
                border: none;
                cursor: pointer;
              ">
              {{ createLoading ? 'Creating...' : 'Create Badge' }}
            </button>
          </form>
        </div>

        <!-- Search and Filters -->
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
            placeholder="Search badges..."
            style="padding: 0.5rem; border: 1px solid #ddd; width: 300px" >
          <select
            v-model="levelFilter"
            style="padding: 0.5rem; border: 1px solid #ddd"
            @change="loadBadges">
            <option value="">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
          </select>
          <button
            style="
              padding: 0.5rem 1rem;
              background: #007bff;
              color: white;
              border: none;
              cursor: pointer;
            "
            @click="loadBadges">
            Search
          </button>
        </div>

        <!-- Badges List -->
        <div v-if="loading">Loading badges...</div>
        <div v-else-if="badges.length === 0">No badges found</div>
        <div v-else>
          <div
            style="
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
              gap: 1rem;
            ">
            <div
              v-for="badge in badges"
              :key="badge._id"
              style="border: 1px solid #ddd; padding: 1rem">
              <div
                style="
                  display: flex;
                  justify-content: between;
                  align-items: start;
                  margin-bottom: 1rem;
                ">
                <div style="flex: 1">
                  <h3 style="margin: 0 0 0.5rem 0">{{ badge.name }}</h3>
                  <p style="margin: 0 0 0.5rem 0; color: #666">
                    {{ badge.description }}
                  </p>
                  <p style="margin: 0">
                    <strong>Level:</strong>
                    <span
                      :style="{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        background: getLevelColor(badge.level),
                        color: 'white',
                        fontSize: '0.8rem',
                      }">
                      {{ badge.level }}
                    </span>
                  </p>
                  <p v-if="badge.category" style="margin: 0.5rem 0 0 0">
                    <strong>Category:</strong> {{ badge.category }}
                  </p>
                  <p v-if="badge.imageUrl" style="margin: 0.5rem 0 0 0">
                    <img
                      :src="badge.imageUrl"
                      :alt="badge.name"
                      style="max-width: 50px; max-height: 50px" >
                  </p>
                </div>
              </div>

              <div
                style="
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-top: 1rem;
                  padding-top: 1rem;
                  border-top: 1px solid #eee;
                ">
                <div style="font-size: 0.9rem; color: #666">
                  <p style="margin: 0">
                    Awarded: {{ badgeStats[badge._id]?.count || 0 }} times
                  </p>
                  <p style="margin: 0">
                    Created:
                    {{ new Date(badge.createdAt).toLocaleDateString() }}
                  </p>
                </div>
                <div style="display: flex; gap: 0.5rem">
                  <button
                    style="
                      padding: 0.25rem 0.5rem;
                      background: #007bff;
                      color: white;
                      border: none;
                      cursor: pointer;
                      font-size: 0.8rem;
                    "
                    @click="editBadge(badge)">
                    Edit
                  </button>
                  <button
                    :disabled="(badgeStats[badge._id]?.count || 0) > 0"
                    style="
                      padding: 0.25rem 0.5rem;
                      background: #dc3545;
                      color: white;
                      border: none;
                      cursor: pointer;
                      font-size: 0.8rem;
                    "
                    :style="{
                      opacity:
                        (badgeStats[badge._id]?.count || 0) > 0 ? 0.5 : 1,
                      cursor:
                        (badgeStats[badge._id]?.count || 0) > 0
                          ? 'not-allowed'
                          : 'pointer',
                    }"
                    @click="deleteBadge(badge)">
                    {{
                      (badgeStats[badge._id]?.count || 0) > 0
                        ? 'In Use'
                        : 'Delete'
                    }}
                  </button>
                </div>
              </div>
            </div>
          </div>

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

        <!-- Edit Badge Modal -->
        <div
          v-if="editingBadge"
          style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          ">
          <div
            style="
              background: white;
              padding: 2rem;
              border-radius: 8px;
              max-width: 500px;
              width: 90%;
            ">
            <h2>Edit Badge</h2>
            <form @submit.prevent="updateBadge">
              <div style="margin-bottom: 1rem">
                <label style="display: block; margin-bottom: 0.5rem"
                  >Badge Name:</label
                >
                <input
                  v-model="editForm.name"
                  type="text"
                  required
                  style="
                    width: 100%;
                    padding: 0.5rem;
                    border: 1px solid #ddd;
                  " >
              </div>
              <div style="margin-bottom: 1rem">
                <label style="display: block; margin-bottom: 0.5rem"
                  >Level:</label
                >
                <select
                  v-model="editForm.level"
                  required
                  style="width: 100%; padding: 0.5rem; border: 1px solid #ddd">
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
              <div style="margin-bottom: 1rem">
                <label style="display: block; margin-bottom: 0.5rem"
                  >Description:</label
                >
                <textarea
                  v-model="editForm.description"
                  required
                  style="
                    width: 100%;
                    padding: 0.5rem;
                    border: 1px solid #ddd;
                    min-height: 80px;
                  " />
              </div>
              <div style="margin-bottom: 1rem">
                <label style="display: block; margin-bottom: 0.5rem"
                  >Image URL:</label
                >
                <input
                  v-model="editForm.imageUrl"
                  type="url"
                  style="
                    width: 100%;
                    padding: 0.5rem;
                    border: 1px solid #ddd;
                  " >
              </div>
              <div style="margin-bottom: 1rem">
                <label style="display: block; margin-bottom: 0.5rem"
                  >Category:</label
                >
                <input
                  v-model="editForm.category"
                  type="text"
                  style="
                    width: 100%;
                    padding: 0.5rem;
                    border: 1px solid #ddd;
                  " >
              </div>
              <div style="display: flex; gap: 1rem">
                <button
                  type="submit"
                  :disabled="updateLoading"
                  style="
                    padding: 0.5rem 1rem;
                    background: #28a745;
                    color: white;
                    border: none;
                    cursor: pointer;
                  ">
                  {{ updateLoading ? 'Updating...' : 'Update Badge' }}
                </button>
                <button
                  type="button"
                  style="
                    padding: 0.5rem 1rem;
                    background: #6c757d;
                    color: white;
                    border: none;
                    cursor: pointer;
                  "
                  @click="cancelEdit">
                  Cancel
                </button>
              </div>
            </form>
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
const badges = ref([])
const badgeStats = ref({})
const currentUser = ref(null)
const loading = ref(true)
const createLoading = ref(false)
const updateLoading = ref(false)
const editingBadge = ref(null)
const message = ref('')
const messageType = ref('')

const searchQuery = ref('')
const levelFilter = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const limit = 12

const createForm = ref({
  name: '',
  description: '',
  level: '',
  imageUrl: '',
  category: '',
})

const editForm = ref({
  name: '',
  description: '',
  level: '',
  imageUrl: '',
  category: '',
})

const isAdmin = computed(() => {
  return currentUser.value?.role === 'admin'
})

onMounted(async () => {
  await loadCurrentUser()
  if (isAdmin.value) {
    await loadBadges()
    await loadBadgeStats()
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

async function loadBadges() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: limit.toString(),
    })

    if (searchQuery.value.trim()) {
      params.append('search', searchQuery.value.trim())
    }

    if (levelFilter.value) {
      params.append('level', levelFilter.value)
    }

    const response = await $fetch(`/api/badges?${params.toString()}`)
    badges.value = response.data || []
    totalPages.value = response.pagination?.pages || 1
  } catch (error) {
    console.error('Failed to load badges:', error)
    badges.value = []
  } finally {
    loading.value = false
  }
}

async function loadBadgeStats() {
  try {
    const token = localStorage.getItem('authToken')
    const response = await $fetch('/api/admin/statistics', {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.data?.popularBadges) {
      const stats = {}
      response.data.popularBadges.forEach((item) => {
        stats[item._id] = { count: item.count }
      })
      badgeStats.value = stats
    }
  } catch (error) {
    console.error('Failed to load badge stats:', error)
  }
}

async function createBadge() {
  createLoading.value = true
  try {
    const token = localStorage.getItem('authToken')
    const response = await $fetch('/api/badges', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: createForm.value,
    })

    if (response.message) {
      showMessage('Badge created successfully!', 'success')
      createForm.value = {
        name: '',
        description: '',
        level: '',
        imageUrl: '',
        category: '',
      }
      await loadBadges()
    }
  } catch (error) {
    console.error('Failed to create badge:', error)
    showMessage(error.data?.error || 'Failed to create badge', 'error')
  } finally {
    createLoading.value = false
  }
}

function editBadge(badge) {
  editingBadge.value = badge
  editForm.value = {
    name: badge.name,
    description: badge.description,
    level: badge.level,
    imageUrl: badge.imageUrl || '',
    category: badge.category || '',
  }
}

function cancelEdit() {
  editingBadge.value = null
  editForm.value = {
    name: '',
    description: '',
    level: '',
    imageUrl: '',
    category: '',
  }
}

async function updateBadge() {
  updateLoading.value = true
  try {
    const token = localStorage.getItem('authToken')
    const response = await $fetch(`/api/badges/${editingBadge.value._id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: editForm.value,
    })

    if (response.message) {
      showMessage('Badge updated successfully!', 'success')
      cancelEdit()
      await loadBadges()
    }
  } catch (error) {
    console.error('Failed to update badge:', error)
    showMessage(error.data?.error || 'Failed to update badge', 'error')
  } finally {
    updateLoading.value = false
  }
}

async function deleteBadge(badge) {
  if (
    !confirm(
      `Are you sure you want to delete the "${badge.name}" badge? This action cannot be undone.`
    )
  ) {
    return
  }

  try {
    const token = localStorage.getItem('authToken')
    const response = await $fetch(`/api/badges/${badge._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (response.message) {
      showMessage('Badge deleted successfully!', 'success')
      await loadBadges()
    }
  } catch (error) {
    console.error('Failed to delete badge:', error)
    showMessage(error.data?.error || 'Failed to delete badge', 'error')
  }
}

function getLevelColor(level) {
  const colors = {
    Beginner: '#28a745',
    Intermediate: '#ffc107',
    Advanced: '#fd7e14',
    Expert: '#dc3545',
  }
  return colors[level] || '#6c757d'
}

function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    loadBadges()
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    loadBadges()
  }
}

function showMessage(msg, type) {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 3000)
}

// Watch search query changes
watch(searchQuery, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadBadges()
  }, 500)
})

let searchTimeout = null
</script>
