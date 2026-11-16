<script setup>
import { ref, computed } from 'vue'
import { useItemsStore } from '@/stores/items'
import { useSettingsStore } from '@/stores/settings'
import StatCard from '@/components/StatCard.vue'

const items = useItemsStore()
const settings = useSettingsStore()

const mode = ref('day')        // 'day' | 'month' | 'range'
const selectedDay = ref(new Date().toISOString().slice(0, 10))
const selectedMonth = ref(new Date().toISOString().slice(0, 7))
const rangeFrom = ref('')
const rangeTo = ref('')

/* ===== Totales según modo ===== */
const result = computed(() => {
  if (mode.value === 'day') {
    return items.earningsInRange(selectedDay.value, selectedDay.value)
  }
  if (mode.value === 'month') {
    const from = `${selectedMonth.value}-01`
    const [y, m] = selectedMonth.value.split('-').map(Number)
    const lastDay = new Date(y, m, 0).getDate()
    const to = `${selectedMonth.value}-${String(lastDay).padStart(2, '0')}`
    return items.earningsInRange(from, to)
  }
  return items.earningsInRange(rangeFrom.value, rangeTo.value)
})

const avgTicket = computed(() =>
  result.value.count ? result.value.total / result.value.count : 0
)

/* ===== Datos del gráfico simple por día (últimos 14 días) ===== */
const last14 = computed(() => {
  const days = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const found = items.earningsByDay.find(x => x.date === key)
    days.push({
      date: key,
      label: d.toLocaleDateString('es-BO', { day: '2-digit' }),
      total: found?.total || 0
    })
  }
  return days
})

const maxDay = computed(() => Math.max(...last14.value.map(d => d.total), 1))

function fmt(n) { return settings.format(n || 0) }
</script>

<template>
  <div class="space-y-5">

    <!-- KPIs -->
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Hoy" :value="fmt(items.todayEarnings)" color="emerald"
        icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      <StatCard label="Este mes" :value="fmt(items.monthEarnings)" color="indigo"
        icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      <StatCard label="Total histórico" :value="fmt(items.totalEarnings)" color="violet"
        icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
      <StatCard label="Ticket promedio" :value="fmt(avgTicket)" color="rose"
        icon="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
    </section>

    <!-- Filtros -->
    <section class="card p-4">
      <div class="flex flex-wrap items-center gap-2 mb-4">
        <button
          @click="mode = 'day'"
          :class="['px-4 py-2 rounded-xl text-sm font-medium transition',
            mode === 'day' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200']"
        >Por día</button>
        <button
          @click="mode = 'month'"
          :class="['px-4 py-2 rounded-xl text-sm font-medium transition',
            mode === 'month' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200']"
        >Por mes</button>
        <button
          @click="mode = 'range'"
          :class="['px-4 py-2 rounded-xl text-sm font-medium transition',
            mode === 'range' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200']"
        >Rango</button>
      </div>

      <div class="flex flex-wrap gap-3 items-end">
        <div v-if="mode === 'day'">
          <label class="label">Día</label>
          <input v-model="selectedDay" type="date" class="input w-auto" />
        </div>
        <div v-if="mode === 'month'">
          <label class="label">Mes</label>
          <input v-model="selectedMonth" type="month" class="input w-auto" />
        </div>
        <template v-if="mode === 'range'">
          <div>
            <label class="label">Desde</label>
            <input v-model="rangeFrom" type="date" class="input w-auto" />
          </div>
          <div>
            <label class="label">Hasta</label>
            <input v-model="rangeTo" type="date" class="input w-auto" />
          </div>
        </template>
      </div>
    </section>

    <!-- Resultado del filtro -->
    <section class="card p-6 bg-gradient-to-tr from-emerald-50 to-teal-50 border-emerald-100">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-emerald-700 uppercase tracking-wide">Total del período</p>
          <p class="mt-1 text-3xl sm:text-4xl font-bold text-emerald-700">{{ fmt(result.total) }}</p>
          <p class="text-sm text-emerald-600/80 mt-1">
            {{ result.count }} prenda{{ result.count !== 1 ? 's' : '' }} cobrada{{ result.count !== 1 ? 's' : '' }}
          </p>
        </div>
        <div class="text-right">
          <p class="text-xs text-emerald-700/70 uppercase">Ticket promedio</p>
          <p class="text-xl font-semibold text-emerald-700">{{ fmt(avgTicket) }}</p>
        </div>
      </div>
    </section>

    <!-- Gráfico últimos 14 días -->
    <section class="card p-6">
      <h2 class="font-semibold text-slate-900 mb-1">Últimos 14 días</h2>
      <p class="text-sm text-slate-500 mb-5">Ingresos diarios</p>

      <div class="flex items-end gap-1.5 h-40">
        <div
          v-for="d in last14"
          :key="d.date"
          class="flex-1 flex flex-col items-center gap-1 group"
          :title="`${d.date}: ${fmt(d.total)}`"
        >
          <div class="w-full flex-1 flex items-end">
            <div
              class="w-full rounded-t bg-gradient-to-t from-indigo-500 to-violet-400 transition-all duration-300 group-hover:brightness-110"
              :style="{ height: `${Math.max(4, (d.total / maxDay) * 100)}%` }"
            ></div>
          </div>
          <span class="text-[10px] text-slate-400">{{ d.label }}</span>
        </div>
      </div>
    </section>

    <!-- Desglose por día -->
    <section class="card p-6">
      <h2 class="font-semibold text-slate-900 mb-4">Desglose por día</h2>
      <div v-if="items.earningsByDay.length" class="space-y-2 max-h-80 overflow-y-auto pr-2">
        <div
          v-for="d in items.earningsByDay"
          :key="d.date"
          class="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition"
        >
          <div>
            <p class="font-medium text-slate-800">
              {{ new Date(d.date).toLocaleDateString('es-BO', { weekday: 'long', day: '2-digit', month: 'long' }) }}
            </p>
            <p class="text-xs text-slate-500">{{ d.count }} prendas cobradas</p>
          </div>
          <p class="font-bold text-emerald-600">{{ fmt(d.total) }}</p>
        </div>
      </div>
      <p v-else class="text-center py-8 text-slate-400 text-sm">Sin cobros registrados aún</p>
    </section>

    <!-- Desglose por mes -->
    <section class="card p-6">
      <h2 class="font-semibold text-slate-900 mb-4">Desglose por mes</h2>
      <div v-if="items.earningsByMonth.length" class="space-y-2">
        <div
          v-for="m in items.earningsByMonth"
          :key="m.month"
          class="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition"
        >
          <div>
            <p class="font-medium text-slate-800 capitalize">
              {{ new Date(m.month + '-01').toLocaleDateString('es-BO', { month: 'long', year: 'numeric' }) }}
            </p>
            <p class="text-xs text-slate-500">{{ m.count }} prendas cobradas</p>
          </div>
          <p class="font-bold text-emerald-600">{{ fmt(m.total) }}</p>
        </div>
      </div>
      <p v-else class="text-center py-8 text-slate-400 text-sm">Sin datos mensuales</p>
    </section>
  </div>
</template>