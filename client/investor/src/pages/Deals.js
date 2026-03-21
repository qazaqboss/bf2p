import { api } from '../api.js';
import { fmt, fmtDate, fmtPct } from '../utils.js';

export default {
  setup() {
    const { ref, onMounted, computed } = Vue;
    const items = ref([]);
    const loading = ref(true);
    const filter = ref('all');
    const search = ref('');

    const statusLabels = { all: 'Все', open: 'Активные', overdue: 'Просрочка', default: 'Дефолт', closed: 'Закрытые', draft: 'Черновики' };
    const statusCounts = ref({});

    const load = async () => {
      try {
        const data = await api.financings();
        items.value = data.items || data || [];
        const counts = { all: items.value.length };
        for (const f of items.value) counts[f.status] = (counts[f.status] || 0) + 1;
        statusCounts.value = counts;
      } catch (e) { console.error(e); }
      finally { loading.value = false; }
    };

    const filtered = computed(() => {
      let list = items.value;
      if (filter.value !== 'all') list = list.filter(f => f.status === filter.value);
      if (search.value.trim()) {
        const q = search.value.toLowerCase();
        list = list.filter(f => (f.client_name||'').toLowerCase().includes(q) || (f.debtor_name||'').toLowerCase().includes(q) || (f.number||'').toLowerCase().includes(q));
      }
      return list;
    });

    const totalOD = computed(() => filtered.value.reduce((s, f) => s + (f.current_od || 0), 0));

    onMounted(load);
    return { items, loading, filter, search, filtered, statusLabels, statusCounts, totalOD, fmt, fmtDate, fmtPct };
  },
  template: `
    <div>
      <div style="margin-bottom:28px">
        <h1 style="font-size:24px;font-weight:800;color:#0f172a">Сделки</h1>
        <p style="color:#64748b;font-size:14px;margin-top:4px">Все финансирования портфеля</p>
      </div>

      <!-- Filter tabs -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px">
        <button v-for="(label, key) in statusLabels" :key="key"
          @click="filter = key"
          :style="filter===key ? 'background:#2563eb;color:#fff;border-color:#2563eb' : 'background:#fff;color:#64748b;border-color:#e2e8f0'"
          style="padding:7px 16px;border-radius:8px;border:1px solid;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s">
          {{label}} <span style="margin-left:4px;opacity:.7">({{statusCounts[key]||0}})</span>
        </button>
      </div>

      <!-- Search -->
      <div style="margin-bottom:20px">
        <input v-model="search" placeholder="Поиск по клиенту, дебитору, номеру..."
          style="width:100%;max-width:400px;padding:9px 14px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;background:#fff"/>
      </div>

      <div v-if="loading" style="text-align:center;padding:80px"><div class="spinner"></div></div>

      <div v-else class="inv-card">
        <!-- Summary bar -->
        <div style="padding:16px 20px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <span style="font-size:13px;color:#64748b">Показано: <strong style="color:#0f172a">{{filtered.length}}</strong> сделок</span>
          <span style="font-size:13px;color:#64748b">Суммарный ОД: <strong style="color:#2563eb">{{fmt(totalOD, true)}}</strong></span>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr>
                <th class="inv-th">№</th>
                <th class="inv-th">Клиент</th>
                <th class="inv-th">Дебитор</th>
                <th class="inv-th">Тариф</th>
                <th class="inv-th" style="text-align:right">Сумма документа</th>
                <th class="inv-th" style="text-align:right">ОД</th>
                <th class="inv-th">Гашение</th>
                <th class="inv-th">Статус</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="f in filtered" :key="f.id">
                <td class="inv-td" style="font-size:12px;color:#94a3b8;white-space:nowrap">{{f.number}}</td>
                <td class="inv-td" style="font-weight:600;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{f.client_name}}</td>
                <td class="inv-td" style="color:#64748b;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{f.debtor_name}}</td>
                <td class="inv-td"><span style="font-size:12px;background:#f1f5f9;color:#64748b;padding:2px 8px;border-radius:4px">{{f.tariff_name||'—'}}</span></td>
                <td class="inv-td" style="text-align:right;white-space:nowrap">{{fmt(f.document_sum)}}</td>
                <td class="inv-td" style="text-align:right;font-weight:700;white-space:nowrap" :style="{color: f.current_od > 0 ? '#dc2626' : '#16a34a'}">{{fmt(f.current_od)}}</td>
                <td class="inv-td" style="white-space:nowrap;font-size:13px">{{fmtDate(f.planned_repayment)}}</td>
                <td class="inv-td">
                  <span v-if="f.status==='open'" class="tag tag-green">Активно</span>
                  <span v-else-if="f.status==='overdue'" class="tag tag-amber">Просрочка{{f.days_overdue>0 ? ' '+f.days_overdue+'д' : ''}}</span>
                  <span v-else-if="f.status==='default'" class="tag tag-red">Дефолт</span>
                  <span v-else-if="f.status==='closed'" class="tag tag-blue">Закрыто</span>
                  <span v-else class="tag tag-gray">Черновик</span>
                </td>
              </tr>
              <tr v-if="!filtered.length">
                <td class="inv-td" colspan="8" style="text-align:center;color:#94a3b8;padding:40px">Нет данных</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
};
