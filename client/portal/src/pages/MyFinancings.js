import { api } from '../api.js';
import { fmt, fmtDate } from '../utils.js';

export default {
  props: ['onDetail'],
  setup(props) {
    const { ref, onMounted, computed } = Vue;
    const items = ref([]);
    const loading = ref(true);
    const filter = ref('all');
    const search = ref('');

    const tabs = [
      { key: 'all', label: 'Все' },
      { key: 'open', label: 'Активные' },
      { key: 'overdue', label: 'Просрочка' },
      { key: 'default', label: 'Дефолт' },
      { key: 'closed', label: 'Закрытые' },
      { key: 'draft', label: 'Черновики' },
    ];

    const counts = computed(() => {
      const c = { all: items.value.length };
      for (const f of items.value) c[f.status] = (c[f.status] || 0) + 1;
      return c;
    });

    const filtered = computed(() => {
      let list = items.value;
      if (filter.value !== 'all') list = list.filter(f => f.status === filter.value);
      if (search.value.trim()) {
        const q = search.value.toLowerCase();
        list = list.filter(f =>
          (f.debtor_name || '').toLowerCase().includes(q) ||
          (f.number || '').toLowerCase().includes(q) ||
          (f.avr_number || '').toLowerCase().includes(q)
        );
      }
      return list;
    });

    const totalOD = computed(() => filtered.value.reduce((s, f) => s + (f.current_od || 0), 0));

    const load = async () => {
      try {
        const d = await api.financings();
        items.value = d.items || [];
      } catch (e) { console.error(e); }
      finally { loading.value = false; }
    };

    onMounted(load);
    return { items, loading, filter, search, tabs, counts, filtered, totalOD, fmt, fmtDate };
  },
  template: `
    <div>
      <div style="margin-bottom:28px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
        <div>
          <h1 style="font-size:24px;font-weight:800;color:#0f172a">Мои финансирования</h1>
          <p style="color:#64748b;font-size:14px;margin-top:4px">История всех сделок по факторингу</p>
        </div>
      </div>

      <!-- Tabs -->
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px">
        <button v-for="t in tabs" :key="t.key" @click="filter=t.key"
          :style="filter===t.key ? 'background:#2563eb;color:#fff;border-color:#2563eb' : 'background:#fff;color:#64748b;border-color:#e2e8f0'"
          style="padding:7px 14px;border-radius:8px;border:1px solid;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s">
          {{t.label}} <span style="opacity:.7;margin-left:3px">({{counts[t.key]||0}})</span>
        </button>
      </div>

      <!-- Search -->
      <div style="margin-bottom:18px">
        <input v-model="search" placeholder="Поиск по дебитору, номеру АВР..."
          style="width:100%;max-width:380px;padding:9px 14px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;background:#fff"/>
      </div>

      <div v-if="loading" style="text-align:center;padding:60px"><div class="spinner"></div></div>

      <div v-else class="cl-card">
        <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <span style="font-size:13px;color:#64748b">Показано: <strong style="color:#0f172a">{{filtered.length}}</strong></span>
          <span v-if="filter!=='closed'" style="font-size:13px;color:#64748b">Активный ОД: <strong style="color:#2563eb">{{fmt(totalOD, true)}}</strong></span>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr>
                <th class="cl-th">Номер</th>
                <th class="cl-th">Дебитор</th>
                <th class="cl-th">АВР</th>
                <th class="cl-th" style="text-align:right">Сумма финанс.</th>
                <th class="cl-th" style="text-align:right">ОД</th>
                <th class="cl-th">Гашение</th>
                <th class="cl-th">Статус</th>
                <th class="cl-th"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="f in filtered" :key="f.id" style="cursor:pointer" @click="$emit('detail', f.id)">
                <td class="cl-td" style="font-size:12px;color:#94a3b8;font-weight:600">{{f.number}}</td>
                <td class="cl-td" style="font-weight:600;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{f.debtor_name}}</td>
                <td class="cl-td" style="font-size:12px;color:#64748b;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{f.avr_number || '—'}}</td>
                <td class="cl-td" style="text-align:right;white-space:nowrap">{{fmt(f.financing_sum)}}</td>
                <td class="cl-td" style="text-align:right;font-weight:700;white-space:nowrap"
                  :style="{color: f.current_od > 0 ? '#dc2626' : '#16a34a'}">
                  {{fmt(f.current_od)}}
                </td>
                <td class="cl-td" style="white-space:nowrap;font-size:13px">{{fmtDate(f.planned_repayment)}}</td>
                <td class="cl-td">
                  <span v-if="f.status==='open'" class="tag tag-green">Активно</span>
                  <span v-else-if="f.status==='overdue'" class="tag tag-amber">Просрочка</span>
                  <span v-else-if="f.status==='default'" class="tag tag-red">Дефолт</span>
                  <span v-else-if="f.status==='closed'" class="tag tag-blue">Закрыто</span>
                  <span v-else class="tag tag-gray">Черновик</span>
                </td>
                <td class="cl-td" style="text-align:right">
                  <span style="color:#2563eb;font-size:13px;font-weight:600">Подробнее →</span>
                </td>
              </tr>
              <tr v-if="!filtered.length">
                <td class="cl-td" colspan="8" style="text-align:center;color:#94a3b8;padding:40px">Нет данных</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
};
