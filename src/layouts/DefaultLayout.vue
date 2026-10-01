<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import AppHeader from '@/components/AppHeader.vue'

const route = useRoute()
const sidebarOpen = ref(false)
const isLogin = computed(() => route.name === 'login')
</script>

<template>
  <div v-if="isLogin" class="min-h-screen">
    <slot />
  </div>
  <div v-else class="min-h-screen flex">
    <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />
    <div class="flex-1 min-w-0 lg:ml-64 flex flex-col">
      <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" />
      <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        <slot />
      </main>
    </div>
  </div>
</template>