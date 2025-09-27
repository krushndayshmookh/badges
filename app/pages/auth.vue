<template>
  <div>
    <main style="padding: 2rem; max-width: 600px; margin: 0 auto">
      <div style="border: 1px solid #ddd; padding: 2rem; border-radius: 8px">
        <!-- Tab Navigation -->
        <div style="display: flex; border-bottom: 1px solid #eee; margin-bottom: 2rem">
          <button
            :style="{
              padding: '1rem 2rem',
              border: 'none',
              background: activeTab === 'login' ? '#007bff' : 'transparent',
              color: activeTab === 'login' ? 'white' : '#666',
              cursor: 'pointer',
            }"
            @click="activeTab = 'login'"
          >
            Login
          </button>
          <button
            :style="{
              padding: '1rem 2rem',
              border: 'none',
              background: activeTab === 'signup' ? '#007bff' : 'transparent',
              color: activeTab === 'signup' ? 'white' : '#666',
              cursor: 'pointer',
            }"
            @click="activeTab = 'signup'"
          >
            Sign Up
          </button>
          <button
            :style="{
              padding: '1rem 2rem',
              border: 'none',
              background: activeTab === 'reset' ? '#007bff' : 'transparent',
              color: activeTab === 'reset' ? 'white' : '#666',
              cursor: 'pointer',
            }"
            @click="activeTab = 'reset'"
          >
            Reset Password
          </button>
        </div>

        <!-- Login Form -->
        <div v-if="activeTab === 'login'">
          <h2>Sign In</h2>
          <form @submit.prevent="login">
            <div style="margin-bottom: 1rem">
              <label style="display: block; margin-bottom: 0.5rem">Email:</label>
              <input
                v-model="loginForm.email"
                type="email"
                required
                style="width: 100%; padding: 0.5rem; border: 1px solid #ddd"
              />
            </div>
            <div style="margin-bottom: 1rem">
              <label style="display: block; margin-bottom: 0.5rem">Password:</label>
              <input
                v-model="loginForm.password"
                type="password"
                required
                style="width: 100%; padding: 0.5rem; border: 1px solid #ddd"
              />
            </div>
            <button
              type="submit"
              :disabled="loginLoading"
              style="
                width: 100%;
                padding: 1rem;
                background: #007bff;
                color: white;
                border: none;
                cursor: pointer;
              "
            >
              {{ loginLoading ? 'Signing In...' : 'Sign In' }}
            </button>
          </form>
        </div>

        <!-- Signup Form -->
        <div v-if="activeTab === 'signup'">
          <h2>Sign Up</h2>
          <form @submit.prevent="signup">
            <div style="margin-bottom: 1rem">
              <label style="display: block; margin-bottom: 0.5rem">First Name:</label>
              <input
                v-model="signupForm.firstName"
                type="text"
                required
                style="width: 100%; padding: 0.5rem; border: 1px solid #ddd"
              />
            </div>
            <div style="margin-bottom: 1rem">
              <label style="display: block; margin-bottom: 0.5rem">Last Name:</label>
              <input
                v-model="signupForm.lastName"
                type="text"
                style="width: 100%; padding: 0.5rem; border: 1px solid #ddd"
              />
            </div>
            <div style="margin-bottom: 1rem">
              <label style="display: block; margin-bottom: 0.5rem">GitHub Username:</label>
              <input
                v-model="signupForm.githubUsername"
                type="text"
                required
                style="width: 100%; padding: 0.5rem; border: 1px solid #ddd"
              />
            </div>
            <div style="margin-bottom: 1rem">
              <label style="display: block; margin-bottom: 0.5rem">Email:</label>
              <input
                v-model="signupForm.email"
                type="email"
                required
                style="width: 100%; padding: 0.5rem; border: 1px solid #ddd"
              />
            </div>
            <div style="margin-bottom: 1rem">
              <label style="display: block; margin-bottom: 0.5rem">Password:</label>
              <input
                v-model="signupForm.password"
                type="password"
                required
                style="width: 100%; padding: 0.5rem; border: 1px solid #ddd"
              />
            </div>
            <button
              type="submit"
              :disabled="signupLoading"
              style="
                width: 100%;
                padding: 1rem;
                background: #28a745;
                color: white;
                border: none;
                cursor: pointer;
              "
            >
              {{ signupLoading ? 'Creating Account...' : 'Sign Up' }}
            </button>
          </form>
        </div>

        <!-- Reset Password Form -->
        <div v-if="activeTab === 'reset'">
          <h2>Reset Password</h2>
          <form @submit.prevent="resetPassword">
            <div style="margin-bottom: 1rem">
              <label style="display: block; margin-bottom: 0.5rem">Email:</label>
              <input
                v-model="resetForm.email"
                type="email"
                required
                style="width: 100%; padding: 0.5rem; border: 1px solid #ddd"
              />
            </div>
            <button
              type="submit"
              :disabled="resetLoading"
              style="
                width: 100%;
                padding: 1rem;
                background: #ffc107;
                color: black;
                border: none;
                cursor: pointer;
              "
            >
              {{ resetLoading ? 'Sending Email...' : 'Send Reset Email' }}
            </button>
          </form>
        </div>

        <!-- Messages -->
        <div
          v-if="message"
          style="margin-top: 1rem; padding: 1rem; border-radius: 4px"
          :style="{
            background: messageType === 'error' ? '#f8d7da' : '#d4edda',
            color: messageType === 'error' ? '#721c24' : '#155724',
            border: messageType === 'error' ? '1px solid #f5c6cb' : '1px solid #c3e6cb',
          }"
        >
          {{ message }}
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
  const activeTab = ref('login')
  const message = ref('')
  const messageType = ref('')

  const loginForm = ref({
    email: '',
    password: '',
  })

  const signupForm = ref({
    firstName: '',
    lastName: '',
    githubUsername: '',
    email: '',
    password: '',
  })

  const resetForm = ref({
    email: '',
  })

  const loginLoading = ref(false)
  const signupLoading = ref(false)
  const resetLoading = ref(false)

  async function login() {
    loginLoading.value = true
    message.value = ''

    try {
      const response = await $fetch('/api/auth/sign-in', {
        method: 'POST',
        body: loginForm.value,
      })

      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token)
        message.value = 'Login successful! Redirecting...'
        messageType.value = 'success'

        await navigateTo('/')
      }
    } catch (error) {
      message.value = error.data?.error || 'Login failed'
      messageType.value = 'error'
    } finally {
      loginLoading.value = false
    }
  }

  async function signup() {
    signupLoading.value = true
    message.value = ''

    try {
      const response = await $fetch('/api/auth/sign-up', {
        method: 'POST',
        body: signupForm.value,
      })

      if (response.message) {
        message.value = response.message + ' You can now sign in.'
        messageType.value = 'success'
        activeTab.value = 'login'

        // Clear signup form
        signupForm.value = {
          firstName: '',
          lastName: '',
          githubUsername: '',
          email: '',
          password: '',
        }
      }
    } catch (error) {
      message.value = error.data?.error || 'Signup failed'
      messageType.value = 'error'
    } finally {
      signupLoading.value = false
    }
  }

  async function resetPassword() {
    resetLoading.value = true
    message.value = ''

    try {
      const response = await $fetch('/api/auth/forgot-password', {
        method: 'POST',
        body: resetForm.value,
      })

      if (response.message) {
        message.value = response.message
        messageType.value = 'success'
        resetForm.value.email = ''
      }
    } catch (error) {
      message.value = error.data?.error || 'Reset failed'
      messageType.value = 'error'
    } finally {
      resetLoading.value = false
    }
  }

  // Check if already logged in
  onMounted(async () => {
    const token = localStorage.getItem('authToken')
    if (token) {
      try {
        await $fetch('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        })
        // If request succeeds, user is already logged in
        navigateTo('/')
      } catch (error) {
        // Token invalid, remove it
        localStorage.removeItem('authToken')
      }
    }
  })
</script>
