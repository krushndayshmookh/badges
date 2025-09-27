<template>
  <div>
    <main style="padding: 2rem; max-width: 1200px; margin: 0 auto">
      <div v-if="loading">Loading user profile...</div>
      <div v-else-if="!user">User not found</div>
      <div v-else>
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem">
          <!-- User Info -->
          <div>
            <div style="border: 1px solid #ddd; padding: 2rem; margin-bottom: 2rem">
              <h1>{{ user.firstName }} {{ user.lastName }}</h1>
              <p>
                <strong>GitHub:</strong>
                @{{ user.githubUsername }}
              </p>
              <p>
                <strong>Role:</strong>
                {{ user.role }}
              </p>
              <p>
                <strong>Badges:</strong>
                {{ user.badgeCount }}
              </p>

              <!-- Social Links -->
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
                    <a :href="url" target="_blank" style="color: #007bff; text-decoration: none">
                      {{ url }}
                    </a>
                  </div>
                </div>
              </div>

              <!-- Edit Social Links for Own Profile -->
              <div v-if="isOwnProfile && showSocialEdit">
                <h3>Edit Social Links</h3>
                <form @submit.prevent="updateSocialLinks">
                  <div
                    v-for="platform in [
                      'twitter',
                      'linkedin',
                      'website',
                      'portfolio',
                      'gitlab',
                      'stackoverflow',
                    ]"
                    :key="platform"
                    style="margin-bottom: 1rem"
                  >
                    <label style="display: block; margin-bottom: 0.5rem">
                      {{ platform.charAt(0).toUpperCase() + platform.slice(1) }}:
                    </label>
                    <input
                      v-model="socialForm[platform]"
                      type="url"
                      style="width: 100%; padding: 0.5rem; border: 1px solid #ddd"
                    />
                  </div>
                  <div style="display: flex; gap: 1rem">
                    <button
                      type="submit"
                      :disabled="socialLoading"
                      style="
                        padding: 0.5rem 1rem;
                        background: #28a745;
                        color: white;
                        border: none;
                        cursor: pointer;
                      "
                    >
                      {{ socialLoading ? 'Saving...' : 'Save' }}
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
                      @click="showSocialEdit = false"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>

              <div v-if="isOwnProfile && !showSocialEdit" style="margin-top: 1rem">
                <button
                  style="
                    padding: 0.5rem 1rem;
                    background: #007bff;
                    color: white;
                    border: none;
                    cursor: pointer;
                    margin-right: 1rem;
                  "
                  @click="editSocialLinks"
                >
                  Edit Social Links
                </button>
              </div>
            </div>

            <!-- Badge Request Form for Own Profile -->
            <div v-if="isOwnProfile && !showBadgeRequest">
              <button
                style="
                  width: 100%;
                  padding: 1rem;
                  background: #28a745;
                  color: white;
                  border: none;
                  cursor: pointer;
                "
                @click="showBadgeRequest = true"
              >
                Request Badge
              </button>
            </div>

            <div v-if="isOwnProfile && showBadgeRequest">
              <div style="border: 1px solid #ddd; padding: 2rem">
                <h3>Request Badge</h3>
                <form @submit.prevent="requestBadge">
                  <div style="margin-bottom: 1rem">
                    <label style="display: block; margin-bottom: 0.5rem">Select Badge:</label>
                    <select
                      v-model="badgeRequestForm.badgeId"
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
                    <label style="display: block; margin-bottom: 0.5rem">Justification:</label>
                    <textarea
                      v-model="badgeRequestForm.justification"
                      required
                      style="
                        width: 100%;
                        padding: 0.5rem;
                        border: 1px solid #ddd;
                        min-height: 100px;
                      "
                      placeholder="Explain why you deserve this badge..."
                    />
                  </div>
                  <div style="display: flex; gap: 1rem">
                    <button
                      type="submit"
                      :disabled="requestLoading"
                      style="
                        padding: 0.5rem 1rem;
                        background: #28a745;
                        color: white;
                        border: none;
                        cursor: pointer;
                      "
                    >
                      {{ requestLoading ? 'Submitting...' : 'Submit Request' }}
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
                      @click="showBadgeRequest = false"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <!-- User Badges -->
          <div>
            <h2>Badges</h2>
            <div v-if="loadingBadges">Loading badges...</div>
            <div v-else-if="userBadges.length === 0">No badges earned yet</div>
            <div
              v-else
              style="
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 1rem;
              "
            >
              <div
                v-for="userBadge in userBadges"
                :key="userBadge._id"
                style="border: 1px solid #ddd; padding: 1rem"
              >
                <h3>{{ userBadge.badge.name }}</h3>
                <p>{{ userBadge.badge.description }}</p>
                <p>
                  <strong>Level:</strong>
                  {{ userBadge.badge.level }}
                </p>
                <p>
                  <strong>Earned:</strong>
                  {{ new Date(userBadge.awardedAt).toLocaleDateString() }}
                </p>
                <p>
                  <strong>Awarded by:</strong>
                  {{ userBadge.awardedBy?.firstName }} {{ userBadge.awardedBy?.lastName }}
                </p>
              </div>
            </div>
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
  const availableBadges = ref([])
  const currentUser = ref(null)
  const loading = ref(true)
  const loadingBadges = ref(true)
  const socialLoading = ref(false)
  const requestLoading = ref(false)

  const showSocialEdit = ref(false)
  const showBadgeRequest = ref(false)
  const message = ref('')
  const messageType = ref('')

  const socialForm = ref({
    twitter: '',
    linkedin: '',
    website: '',
    portfolio: '',
    gitlab: '',
    stackoverflow: '',
  })

  const badgeRequestForm = ref({
    badgeId: '',
    justification: '',
  })

  const isOwnProfile = computed(() => {
    return (
      currentUser.value &&
      user.value &&
      currentUser.value.githubUsername === user.value.githubUsername
    )
  })

  onMounted(async () => {
    loadCurrentUser()
    await loadUserProfile()
    loadUserBadges()
    loadAvailableBadges()
  })

  async function loadCurrentUser() {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return

      const response = await $fetch('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.data) {
        currentUser.value = response.data
      }
    } catch (error) {
      console.error('Failed to load current user:', error)
    }
  }

  async function loadUserProfile() {
    try {
      const response = await $fetch(`/api/users/public?search=${githubUsername}`)
      const foundUser = response.data?.find(u => u.githubUsername === githubUsername)

      if (foundUser) {
        user.value = foundUser
        // Initialize social form with current values
        if (foundUser.socialLinks) {
          Object.keys(socialForm.value).forEach(platform => {
            socialForm.value[platform] = foundUser.socialLinks[platform] || ''
          })
        }
      }
    } catch (error) {
      console.error('Failed to load user profile:', error)
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

  async function loadAvailableBadges() {
    try {
      const response = await $fetch('/api/badges')
      availableBadges.value = response.data || []
    } catch (error) {
      console.error('Failed to load badges:', error)
    }
  }

  function editSocialLinks() {
    showSocialEdit.value = true
  }

  async function updateSocialLinks() {
    socialLoading.value = true
    message.value = ''

    try {
      const token = localStorage.getItem('authToken')
      const response = await $fetch('/api/users/social-links', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: { socialLinks: socialForm.value },
      })

      if (response.message) {
        message.value = 'Social links updated successfully!'
        messageType.value = 'success'
        showSocialEdit.value = false
        await loadUserProfile() // Reload to show updated links

        setTimeout(() => {
          message.value = ''
        }, 3000)
      }
    } catch (error) {
      message.value = error.data?.error || 'Failed to update social links'
      messageType.value = 'error'
    } finally {
      socialLoading.value = false
    }
  }

  async function requestBadge() {
    requestLoading.value = true
    message.value = ''

    try {
      const token = localStorage.getItem('authToken')
      const response = await $fetch('/api/badge-requests', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: badgeRequestForm.value,
      })

      if (response.message) {
        message.value = 'Badge request submitted successfully!'
        messageType.value = 'success'
        showBadgeRequest.value = false

        // Reset form
        badgeRequestForm.value = {
          badgeId: '',
          justification: '',
        }

        setTimeout(() => {
          message.value = ''
        }, 3000)
      }
    } catch (error) {
      message.value = error.data?.error || 'Failed to submit badge request'
      messageType.value = 'error'
    } finally {
      requestLoading.value = false
    }
  }

  // Watch route changes
  watch(
    () => route.params.githubUsername,
    async newUsername => {
      if (newUsername) {
        loading.value = true
        loadingBadges.value = true
        await Promise.all([loadUserProfile(), loadUserBadges()])
      }
    }
  )
</script>
