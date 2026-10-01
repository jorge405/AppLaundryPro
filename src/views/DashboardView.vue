<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useItemsStore, CATEGORIES, STATUSES } from '@/stores/items'
import StatCard from '@/components/StatCard.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { timeAgo, formatMoney } from '@/utils/format'
import { useSettingsStore } from '@/stores/settings'
const settings = useSettingsStore()


const items = useItemsStore()
const recent = computed(() => items.items.slice(0, 5))

const categoryRows = computed(() =>
  CATEGORIES.map(c => ({
    ...c,
    count: items.byCategory[c.id] || 0,
    pct: items.stats.total ? Math.round(((items.byCategory[c.id] || 0) / items.stats.total) * 100) : 0
  })).filter(c => c.count > 0)
)
</script>

<template>
  <div class="space-y-6">
    <!-- KPIs -->
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Total prendas" :value="items.stats.total" color="indigo"
        icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      <StatCard label="En proceso" :value="items.stats.enProceso" color="sky"
        icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      <StatCard label="Listas" :value="items.stats.listo" color="emerald"
        icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      <StatCard label="Ingresos" :value="settings.format(items.stats.ingresos)" color="rose"
        icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </section>

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Actividad reciente -->
      <section class="lg:col-span-2 card p-6">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h2 class="font-semibold text-slate-900">Actividad reciente</h2>
            <p class="text-sm text-slate-500">Últimas prendas registradas</p>
          </div>
          <RouterLink :to="{ name: 'items' }" class="text-sm font-medium text-indigo-600 hover:text-indigo-700">Ver todo →</RouterLink>
        </div>

        <div v-if="!recent.length" class="text-center py-10">
          <p class="text-slate-400 text-sm">Aún no hay prendas registradas.</p>
          <RouterLink :to="{ name: 'items' }" class="btn-primary mt-4 inline-flex">Añadir primera prenda</RouterLink>
        </div>

        <ul v-else class="divide-y divide-slate-100">
          <li v-for="item in recent" :key="item.id" class="py-3 flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-slate-100 grid place-items-center text-lg shrink-0">
              {{ CATEGORIES.find(c => c.id === item.category)?.icon || '📦' }}
            </div>
            <div class="flex-1 min-w-0">
              <RouterLink :to="{ name: 'item-detail', params: { id: item.id } }" class="font-medium text-slate-800 hover:text-indigo-600 truncate block">
                {{ item.name }}
              </RouterLink>
              <p class="text-xs text-slate-500">{{ item.code }} · {{ timeAgo(item.createdAt) }}</p>
            </div>
            <StatusBadge :status="item.status" />
          </li>
        </ul>
      </section>

      <!-- Distribución por categoría -->
      <section class="card p-6">
        <h2 class="font-semibold text-slate-900">Por categoría</h2>
        <p class="text-sm text-slate-500 mb-5">Distribución de las prendas</p>

        <div v-if="!categoryRows.length" class="text-center py-8 text-slate-400 text-sm">Sin datos</div>

        <ul v-else class="space-y-4">
          <li v-for="c in categoryRows" :key="c.id">
            <div class="flex items-center justify-between text-sm mb-1.5">
              <span class="flex items-center gap-2 text-slate-700"><span>{{ c.icon }}</span> {{ c.label }}</span>
              <span class="font-medium text-slate-900">{{ c.count }}</span>
            </div>
            <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                :style="{ width: c.pct + '%' }" />
            </div>
          </li>
        </ul>
      </section>
    </div>

    <!-- Estados -->
    <section class="card p-6">
      <h2 class="font-semibold text-slate-900 mb-5">Estado del flujo</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div v-for="s in STATUSES" :key="s.id" class="rounded-xl border border-slate-200/70 p-4 text-center hover:border-indigo-200 transition">
          <p class="text-2xl font-bold text-slate-900">{{ items.items.filter(i => i.status === s.id).length }}</p>
          <p class="text-xs text-slate-500 mt-1">{{ s.label }}</p>
        </div>
      </div>
    </section>
  </div>
</template>