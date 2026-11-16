<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useSuperAdminStore } from '@/stores/superadmin'
import { useBranchesStore } from '@/stores/branches.js'
import { useItemsStore } from '@/stores/items.js'
import { usePlansStore } from '@/stores/plans'
import { useSettingsStore } from '@/stores/settings'
import StatCard from '@/components/StatCard.vue'

const sa = useSuperAdminStore()
const branches = useBranchesStore()
const items = useItemsStore()
const plans = usePlansStore()
const settings = useSettingsStore()

const recentClients = computed(() => sa.clients.slice(0, 5))
const expiringSoon = computed(() =>
  sa.clients.filter(c => {
    const days = sa.daysLeft(c)
    return days > 0 && days <= 30
  })
)

/** Sucursales de cada empresa */
function branchesOf(companyId) {
  return branches.list.filter(b => b.companyId === companyId)
}

/** Ingresos del mes de una empresa (suma de sus sucursales) */
function monthTotal(companyId) {
  return branchesOf(companyId)
    .reduce((s, b) => s + items.monthEarningsOf(b.id), 0)
}

/** Serie mensual de una empresa (últimos 6 meses) */
function trend(companyId) {
  const list = branchesOf(companyId)
  const series = new Map()
  for (const b of list) {
    for (const t of items.monthlyTrend(b.id, 6)) {
      series.set(t.month, (series.get(t.month) || 0) + t.total)
    }
  }
  const now = new Date()
  const out = []
  for (let k = 5; k >= 0; k--) {
    const d = new Date(now.getFullYear(), now.getMonth() - k, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    out.push({ month: key, total: series.get(key) || 0 })
  }
  return out
}

function maxTrend(companyId) {
  return Math.max(1, ...trend(companyId).map(t => t.total))
}

function monthLabel(key) {
  const [y, m] = key.split('-')
  const names = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${names[Number(m) - 1]} ${y.slice(2)}`
}

function fmt(n) { return settings.format(n || 0) }
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-white p-6 lg:p-10">
    <div class="max-w-7xl mx-auto space-y-8">

      <!-- Header -->
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 class="text-3xl font-bold">Panel SuperAdmin</h1>
          <p class="text-white/50 text-sm mt-1">Gestión global del SaaS LaundryPro</p>
        </div>
        <div class="flex items-center gap-2">
          <RouterLink :to="{ name: 'sa-clients' }" class="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition">
            Clientes
          </RouterLink>
          <RouterLink :to="{ name: 'sa-plans' }" class="px-4 py-2 rounded-xl text-sm font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition">
            Planes
          </RouterLink>
          <button @click="sa.logout(); $router.push({ name: 'sa-login' })"
            class="px-4 py-2 rounded-xl text-sm font-medium text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition">
            Salir
          </button>
        </div>
      </div>

      <!-- KPIs -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur">
          <p class="text-xs uppercase text-white/50 tracking-wide">Clientes</p>
          <p class="text-3xl font-bold mt-2">{{ sa.stats.total }}</p>
        </div>
        <div class="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-5">
          <p class="text-xs uppercase text-emerald-300/70 tracking-wide">Activos</p>
          <p class="text-3xl font-bold mt-2 text-emerald-300">{{ sa.stats.active }}</p>
        </div>
        <div class="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-5">
          <p class="text-xs uppercase text-rose-300/70 tracking-wide">Vencidos</p>
          <p class="text-3xl font-bold mt-2 text-rose-300">{{ sa.stats.expired }}</p>
        </div>
        <div class="rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 p-5">
          <p class="text-xs uppercase text-fuchsia-300/70 tracking-wide">Ingresos</p>
          <p class="text-3xl font-bold mt-2 text-fuchsia-300">{{ fmt(sa.stats.revenue) }}</p>
        </div>
      </div>

      <!-- Alertas de vencimiento -->
      <div v-if="expiringSoon.length" class="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-5">
        <p class="font-semibold text-amber-300 mb-3">
          ⚠️ {{ expiringSoon.length }} cliente{{ expiringSoon.length > 1 ? 's' : '' }} por vencer en los próximos 30 días
        </p>
        <div class="space-y-2">
          <div v-for="c in expiringSoon" :key="c.id" class="flex items-center justify-between text-sm">
            <span class="text-white/80">{{ c.name }} · {{ c.planName }}</span>
            <span class="text-amber-300 font-medium">{{ sa.daysLeft(c) }} días</span>
          </div>
        </div>
      </div>

      <!-- Últimos clientes -->
      <div class="rounded-2xl bg-white/5 border border-white/10 p-6">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-semibold">Últimos clientes</h2>
          <RouterLink :to="{ name: 'sa-clients' }" class="text-sm text-fuchsia-300 hover:text-fuchsia-200">
            Ver todos →
          </RouterLink>
        </div>

        <div v-if="recentClients.length" class="space-y-3">
          <div v-for="c in recentClients" :key="c.id" class="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-fuchsia-500 to-purple-500 grid place-items-center font-semibold shrink-0">
              {{ c.name[0].toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium truncate">{{ c.name }}</p>
              <p class="text-xs text-white/50 truncate">{{ c.email }}</p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-xs text-white/60">{{ c.planName }}</p>
              <p :class="['text-xs font-medium', sa.isExpired(c) ? 'text-rose-400' : 'text-emerald-400']">
                {{ sa.isExpired(c) ? 'Vencido' : `${sa.daysLeft(c)} días` }}
              </p>
            </div>
          </div>
        </div>
        <p v-else class="text-center py-8 text-white/40 text-sm">Sin clientes registrados</p>
      </div>

      <!-- Empresas y sucursales -->
      <div class="rounded-2xl bg-white/5 border border-white/10 p-6">
        <div class="flex items-center justify-between mb-5">
          <h2 class="font-semibold">Empresas · sucursales e ingresos por mes</h2>
          <span class="text-xs text-white/50">{{ branches.stats.total }} sucursales</span>
        </div>

        <div v-if="sa.clients.length" class="grid lg:grid-cols-2 gap-4">
          <div
            v-for="c in sa.clients"
            :key="c.id"
            class="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="font-semibold truncate">{{ c.name }}</p>
                <p class="text-xs text-white/50">{{ c.planName }} · {{ branchesOf(c.id).length }} sucursal(es)</p>
              </div>
              <div class="text-right shrink-0">
                <p class="text-xs text-white/50">Ingresos del mes</p>
                <p class="text-lg font-bold text-emerald-300">{{ fmt(monthTotal(c.id)) }}</p>
              </div>
            </div>

            <!-- Barras mensuales -->
            <div class="flex items-end gap-1 h-16">
              <div v-for="t in trend(c.id)" :key="t.month" class="flex-1 flex flex-col items-center gap-1">
                <div
                  class="w-full rounded-t bg-emerald-400/70"
                  :style="{ height: `${Math.max(3, (t.total / maxTrend(c.id)) * 56)}px` }"
                  :title="`${t.month}: ${fmt(t.total)}`"
                ></div>
                <span class="text-[9px] text-white/40">{{ monthLabel(t.month) }}</span>
              </div>
            </div>

            <!-- Sucursales de la empresa -->
            <div v-if="branchesOf(c.id).length" class="space-y-1.5 pt-2 border-t border-white/10">
              <div
                v-for="b in branchesOf(c.id)"
                :key="b.id"
                class="flex items-center justify-between gap-3 text-xs"
              >
                <div class="min-w-0">
                  <p class="text-white/85 truncate">{{ b.name }} · {{ b.manager }}</p>
                  <p class="text-white/40 truncate">{{ b.address }} · {{ b.openTime }}–{{ b.closeTime }}</p>
                </div>
                <span class="text-white/70 whitespace-nowrap shrink-0">{{ fmt(items.monthEarningsOf(b.id)) }}</span>
              </div>
            </div>
            <p v-else class="text-xs text-white/40 pt-2 border-t border-white/10">
              Esta empresa aún no tiene sucursales registradas.
            </p>
          </div>
        </div>
        <p v-else class="text-center py-8 text-white/40 text-sm">Sin empresas registradas</p>
      </div>

      <!-- Planes -->
      <div class="rounded-2xl bg-white/5 border border-white/10 p-6">
        <h2 class="font-semibold mb-5">Planes disponibles</h2>
        <div class="grid sm:grid-cols-3 gap-4">
          <div v-for="p in plans.plans" :key="p.id" class="rounded-xl bg-white/5 border border-white/10 p-4">
            <p class="font-semibold">{{ p.name }}</p>
            <p class="text-2xl font-bold mt-2">{{ fmt(p.price) }}</p>
            <p class="text-xs text-white/50 mt-1">/ {{ p.durationDays }} días</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>