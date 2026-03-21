import { api } from '../api.js';
import { fmt, fmtDate, fmtPct } from '../utils.js';

export default {
  setup() {
    const { ref, onMounted, nextTick } = Vue;
    const data = ref(null);
    const loading = ref(true);
    let chartRppu = null;

    const load = async () => {
      try {
        data.value = await api.aging();
        await nextTick();
        renderChart();
      } catch (e) { console.error(e); }
      finally { loading.value = false; }
    };

    const renderChart = () => {
      const d = data.value;
      if (!d?.buckets?.length) return;
      const ctx = document.getElementById('chartRppu');
      if (!ctx) return;
      if (chartRppu) chartRppu.destroy();
      const colors = { '0_7': '#22c55e', '8_30': '#f59e0b', '31_60': '#f97316', '60plus': '#ef4444' };
      chartRppu = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: d.buckets.map(b => b.label),
          datasets: [
            { label: 'ОД (₸)', data: d.buckets.map(b => b.sum_od), backgroundColor: d.buckets.map(b => colors[b.key] + 'cc'), borderRadius: 6 },
            { label: 'РППУ (₸)', data: d.buckets.map(b => b.rppu), backgroundColor: d.buckets.map(b => colors[b.key] + '55'), borderRadius: 6 },
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'top', labels: { font: { size: 12 }, padding: 12 } } },
          scales: {
            y: { ticks: { callback: v => '₸' + (v/1e6).toFixed(0) + 'М', font: { size: 11 } }, grid: { color: '#f1f5f9' } },
            x: { ticks: { font: { size: 12 } }, grid: { display: false } }
          }
        }
      });
    };

    onMounted(load);
    return { data, loading, fmt, fmtDate, fmtPct };
  },
  template: `
    <div>
      <div style="margin-bottom:28px">
        <h1 style="font-size:24px;font-weight:800;color:#0f172a">Риски</h1>
        <p style="color:#64748b;font-size:14px;margin-top:4px">Просрочка, РППУ и анализ дефолтов</p>
      </div>

      <div v-if="loading" style="text-align:center;padding:80px"><div class="spinner"></div></div>

      <template v-else-if="data">
        <!-- RPPU summary -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px" class="grid-4">
          <div v-for="b in data.buckets" :key="b.key" class="inv-card inv-metric"
            :style="{color: b.key==='0_7'?'#16a34a':b.key==='8_30'?'#b45309':b.key==='31_60'?'#ea580c':'#dc2626'}">
            <div class="kpi-label">{{b.label}}</div>
            <div class="kpi-val">{{b.count}} сделок</div>
            <div class="kpi-sub">ОД: {{fmt(b.sum_od, true)}}</div>
            <div class="kpi-sub" style="margin-top:2px">РППУ: {{fmt(b.rppu, true)}} ({{(b.rppuRate*100).toFixed(0)}}%)</div>
            <span class="kpi-badge" :style="{background: b.key==='0_7'?'#dcfce7':b.key==='8_30'?'#fef3c7':b.key==='31_60'?'#ffedd5':'#fee2e2', color: b.key==='0_7'?'#15803d':b.key==='8_30'?'#b45309':b.key==='31_60'?'#c2410c':'#dc2626'}">
              {{b.key==='0_7'?'Норма':b.key==='8_30'?'Внимание':b.key==='31_60'?'Опасно':'Критично'}}
            </span>
          </div>
        </div>

        <!-- Total RPPU card -->
        <div class="inv-card" style="padding:20px;margin-bottom:28px;border-left:4px solid #ef4444;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
          <div>
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b">Итоговый РППУ</div>
            <div style="font-size:32px;font-weight:800;color:#dc2626;margin-top:4px">{{fmt(data.total_rppu, true)}}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:12px;color:#64748b">Резерв на покрытие потерь</div>
            <div style="font-size:14px;color:#64748b;margin-top:4px">Рассчитан по ставкам от 0% до 100%</div>
          </div>
        </div>

        <!-- Chart -->
        <div class="inv-card" style="padding:24px;margin-bottom:28px">
          <h3 style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:20px">ОД vs РППУ по диапазонам просрочки</h3>
          <div style="height:240px"><canvas id="chartRppu"></canvas></div>
        </div>

        <!-- Overdue detail table -->
        <div class="inv-card">
          <div style="padding:20px;border-bottom:1px solid #f1f5f9">
            <h3 style="font-size:15px;font-weight:700;color:#0f172a">Просроченные финансирования</h3>
          </div>
          <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr>
                  <th class="inv-th">Клиент</th>
                  <th class="inv-th">Дебитор</th>
                  <th class="inv-th" style="text-align:right">ОД</th>
                  <th class="inv-th">Плановое гашение</th>
                  <th class="inv-th" style="text-align:right">Дней просрочки</th>
                  <th class="inv-th">РППУ %</th>
                  <th class="inv-th" style="text-align:right">РППУ сумма</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="b in data.buckets" :key="b.key">
                  <tr v-if="b.items?.length" style="background:#f8fafc">
                    <td class="inv-td" colspan="7" style="font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#64748b">
                      {{b.label}} — {{b.count}} сделок | ОД: {{fmt(b.sum_od, true)}}
                    </td>
                  </tr>
                  <tr v-for="f in (b.items || [])" :key="f.id">
                    <td class="inv-td" style="font-weight:600">{{f.client_name}}</td>
                    <td class="inv-td" style="color:#64748b">{{f.debtor_name}}</td>
                    <td class="inv-td" style="text-align:right;font-weight:700;color:#dc2626">{{fmt(f.current_od)}}</td>
                    <td class="inv-td" style="font-size:13px">{{fmtDate(f.planned_repayment)}}</td>
                    <td class="inv-td" style="text-align:right">
                      <span :class="['tag', f.real_days > 60 ? 'tag-red' : f.real_days > 30 ? 'tag-amber' : 'tag-green']">
                        {{f.real_days}} дн.
                      </span>
                    </td>
                    <td class="inv-td">
                      <span :style="{color: b.rppuRate >= 1 ? '#dc2626' : b.rppuRate >= 0.5 ? '#ea580c' : b.rppuRate >= 0.25 ? '#b45309' : '#16a34a'}">
                        {{(b.rppuRate * 100).toFixed(0)}}%
                      </span>
                    </td>
                    <td class="inv-td" style="text-align:right;color:#dc2626">{{fmt(f.current_od * b.rppuRate)}}</td>
                  </tr>
                </template>
                <tr v-if="!data.buckets?.some(b => b.items?.length)">
                  <td class="inv-td" colspan="7" style="text-align:center;color:#94a3b8;padding:40px">Просроченных сделок нет</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
  `
};
