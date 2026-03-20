import { api } from '../api.js';
import { fmt, fmtDate } from '../utils.js';

export default {
  setup() {
    const { ref, onMounted } = Vue;
    const tab = ref('portfolio');
    const portfolio = ref(null);
    const aging = ref(null);
    const loading = ref(false);

    const loadPortfolio = async () => {
      loading.value = true;
      try { portfolio.value = await api.analyticsPortfolio(); }
      catch (e) { console.error(e); }
      finally { loading.value = false; }
    };

    const loadAging = async () => {
      loading.value = true;
      try { aging.value = await api.analyticsAging(); }
      catch (e) { console.error(e); }
      finally { loading.value = false; }
    };

    const switchTab = (t) => {
      tab.value = t;
      if (t === 'portfolio' && !portfolio.value) loadPortfolio();
      if (t === 'aging' && !aging.value) loadAging();
    };

    onMounted(() => loadPortfolio());

    return { tab, portfolio, aging, loading, switchTab, fmt, fmtDate };
  },
  template: `
    <div>
      <h1 style="font-size:22px;font-weight:700;color:#111827;margin-bottom:20px">Аналитика</h1>

      <!-- Tabs -->
      <div style="display:flex;gap:4px;margin-bottom:20px;background:#f3f4f6;border-radius:10px;padding:4px;width:fit-content">
        <button v-for="t in [{v:'portfolio',l:'Портфель'},{v:'aging',l:'Просрочка (РППУ)'}]" :key="t.v"
                @click="switchTab(t.v)"
                :style="tab===t.v ? 'background:#fff;color:#111827;box-shadow:0 1px 3px rgba(0,0,0,.1)' : 'background:transparent;color:#6b7280'"
                style="border:none;padding:8px 16px;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;transition:all .15s">
          {{t.l}}
        </button>
      </div>

      <div v-if="loading" style="text-align:center;padding:60px"><div class="spinner"></div></div>

      <!-- Портфель -->
      <template v-if="tab==='portfolio' && portfolio && !loading">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px">
          <div class="card metric-card">
            <div class="metric-lbl">Активный ОД</div>
            <div class="metric-val">{{fmt(portfolio.total_od, true)}}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:4px">{{portfolio.count}} финансирований</div>
          </div>
          <div class="card metric-card">
            <div class="metric-lbl">Сумма уступок</div>
            <div class="metric-val">{{fmt(portfolio.total_docs, true)}}</div>
          </div>
          <div class="card metric-card">
            <div class="metric-lbl">Средн. сделка</div>
            <div class="metric-val">{{portfolio.count > 0 ? fmt(portfolio.total_od / portfolio.count, true) : '—'}}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div class="card" style="padding:20px">
            <h3 style="font-size:14px;font-weight:700;margin-bottom:16px">Топ-10 клиентов по ОД</h3>
            <div v-for="([name, od], i) in portfolio.by_client" :key="name"
                 style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f3f4f6">
              <span style="width:20px;font-size:12px;font-weight:700;color:#6b7280">{{i+1}}</span>
              <div style="flex:1;min-width:0">
                <div style="font-size:13px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{name}}</div>
                <div style="height:4px;background:#eff6ff;border-radius:4px;margin-top:4px">
                  <div :style="{width: Math.round(od/portfolio.total_od*100)+'%'}" style="height:4px;background:#2563eb;border-radius:4px"></div>
                </div>
              </div>
              <span style="font-size:13px;font-weight:700;white-space:nowrap">{{fmt(od, true)}}</span>
            </div>
          </div>

          <div class="card" style="padding:20px">
            <h3 style="font-size:14px;font-weight:700;margin-bottom:16px">Разбивка по тарифным сериям</h3>
            <div v-for="([series, od]) in portfolio.by_series" :key="series"
                 style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f3f4f6">
              <span class="tag tag-violet" style="width:40px;justify-content:center">{{series}}</span>
              <div style="flex:1">
                <div style="height:8px;background:#ede9fe;border-radius:4px">
                  <div :style="{width: Math.round(od/portfolio.total_od*100)+'%'}" style="height:8px;background:#7c3aed;border-radius:4px"></div>
                </div>
              </div>
              <span style="font-size:13px;font-weight:700;white-space:nowrap">{{fmt(od, true)}}</span>
              <span style="font-size:12px;color:#6b7280">{{Math.round(od/portfolio.total_od*100)}}%</span>
            </div>
          </div>
        </div>
      </template>

      <!-- Просрочка -->
      <template v-if="tab==='aging' && aging && !loading">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px">
          <div v-for="b in aging.buckets" :key="b.key" class="card" style="padding:16px">
            <div class="lbl">{{b.label}}</div>
            <div style="font-size:20px;font-weight:700;margin-top:4px">{{b.count}} <span style="font-size:13px;font-weight:400;color:#6b7280">сделок</span></div>
            <div style="font-size:14px;font-weight:600;margin-top:4px">{{fmt(b.sum_od, true)}}</div>
            <div style="margin-top:8px;padding-top:8px;border-top:1px solid #f3f4f6">
              <div style="font-size:11px;color:#6b7280">РППУ {{Math.round(b.rppuRate*100)}}%</div>
              <div style="font-size:14px;font-weight:700;color:#dc2626">{{fmt(b.rppu, true)}}</div>
            </div>
          </div>
        </div>

        <div class="card" style="padding:16px;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <span style="font-size:15px;font-weight:700">Итого РППУ:</span>
          <span style="font-size:20px;font-weight:800;color:#dc2626">{{fmt(aging.total_rppu)}}</span>
        </div>

        <div v-for="b in aging.buckets.filter(x=>x.count>0)" :key="b.key" class="card" style="margin-bottom:16px;overflow:hidden">
          <div style="padding:14px 20px;background:#f9fafb;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between">
            <span style="font-weight:700;font-size:14px">{{b.label}}</span>
            <span style="font-size:13px;color:#6b7280">РППУ {{Math.round(b.rppuRate*100)}}% = {{fmt(b.rppu)}}</span>
          </div>
          <table style="width:100%;border-collapse:collapse">
            <thead><tr>
              <th class="th">№</th><th class="th">Клиент</th><th class="th">Дебитор</th>
              <th class="th">ОД</th><th class="th">Дней просрочки</th>
            </tr></thead>
            <tbody>
              <tr v-for="f in b.items" :key="f.id">
                <td class="td" style="font-weight:600;color:#2563eb">{{f.number}}</td>
                <td class="td">{{f.client_name}}</td>
                <td class="td">{{f.debtor_name}}</td>
                <td class="td" style="text-align:right;font-weight:700;color:#dc2626">{{fmt(f.current_od)}}</td>
                <td class="td" style="text-align:right;font-weight:700">{{f.real_days}} дн.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </div>
  `
};
