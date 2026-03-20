import { api } from '../api.js';
import { fmt, fmtDate, daysUntil, statusTag } from '../utils.js';

export default {
  emits: ['navigate'],
  setup(props, { emit }) {
    const { ref, onMounted } = Vue;
    const data = ref(null);
    const loading = ref(true);

    onMounted(async () => {
      try { data.value = await api.dashboard(); }
      catch (e) { console.error(e); }
      finally { loading.value = false; }
    });

    return { data, loading, fmt, fmtDate, daysUntil, statusTag };
  },
  template: `
    <div>
      <div style="margin-bottom:24px">
        <h1 style="font-size:22px;font-weight:700;color:#111827">Дашборд</h1>
        <p style="color:#6b7280;font-size:14px;margin-top:2px">Обзор портфеля и ключевые показатели</p>
      </div>

      <div v-if="loading" style="text-align:center;padding:60px"><div class="spinner"></div></div>

      <template v-else-if="data">
        <!-- Метрики -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px">
          <div class="card metric-card">
            <div class="metric-lbl">Активный портфель</div>
            <div class="metric-val" style="font-size:20px">{{fmt(data.portfolio?.total_od, true)}}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:4px">{{data.portfolio?.count}} финансирований</div>
          </div>
          <div class="card metric-card">
            <div class="metric-lbl">Просрочка</div>
            <div class="metric-val" style="font-size:20px;color:#dc2626">{{fmt(data.overdue?.total_od, true)}}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:4px">{{data.overdue?.count}} финансирований</div>
          </div>
          <div class="card metric-card">
            <div class="metric-lbl">Комиссии (нач.)</div>
            <div class="metric-val" style="font-size:20px;color:#7c3aed">{{fmt(data.portfolio?.total_commissions, true)}}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:4px">K1 + K2 итого</div>
          </div>
          <div class="card metric-card">
            <div class="metric-lbl">Статусы</div>
            <div style="margin-top:8px;display:flex;flex-direction:column;gap:4px">
              <div v-for="s in data.by_status" :key="s.status" style="display:flex;justify-content:space-between;font-size:13px">
                <span :class="'tag ' + statusTag(s.status).cls" style="font-size:11px">{{statusTag(s.status).text}}</span>
                <span style="font-weight:600">{{s.cnt}}</span>
              </div>
            </div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <!-- Ближайшие гашения -->
          <div class="card" style="padding:20px">
            <h3 style="font-size:15px;font-weight:700;margin-bottom:16px;color:#111827">Ближайшие гашения</h3>
            <div v-if="!data.upcoming_repayments?.length" style="color:#6b7280;font-size:14px">Нет данных</div>
            <div v-for="f in data.upcoming_repayments" :key="f.id"
                 style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f3f4f6;cursor:pointer"
                 @click="$emit('navigate','financing-detail',f.id)">
              <div>
                <div style="font-size:13px;font-weight:600;color:#1d4ed8">{{f.number}}</div>
                <div style="font-size:12px;color:#6b7280">{{f.client_name}}</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:13px;font-weight:600">{{fmt(f.current_od, true)}}</div>
                <span :class="'tag ' + daysUntil(f.planned_repayment, f.status).cls" style="font-size:11px">
                  {{daysUntil(f.planned_repayment, f.status).text}}
                </span>
              </div>
            </div>
          </div>

          <!-- Топ клиенты -->
          <div class="card" style="padding:20px">
            <h3 style="font-size:15px;font-weight:700;margin-bottom:16px;color:#111827">Топ клиенты по ОД</h3>
            <div v-if="!data.top_clients?.length" style="color:#6b7280;font-size:14px">Нет данных</div>
            <div v-for="(c,i) in data.top_clients" :key="c.name"
                 style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f3f4f6">
              <div style="display:flex;align-items:center;gap:10px">
                <span style="width:22px;height:22px;background:#eff6ff;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#2563eb">{{i+1}}</span>
                <div>
                  <div style="font-size:13px;font-weight:600">{{c.name}}</div>
                  <div style="font-size:12px;color:#6b7280">{{c.deals}} сделок</div>
                </div>
              </div>
              <div style="font-size:13px;font-weight:700">{{fmt(c.od, true)}}</div>
            </div>
          </div>
        </div>
      </template>
    </div>
  `
};
