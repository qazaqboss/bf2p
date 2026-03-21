import { api } from '../api.js';
import { fmt, fmtPct, fmtMonth, calcYield } from '../utils.js';

export default {
  setup() {
    const { ref, onMounted, nextTick, computed } = Vue;
    const data = ref(null);
    const loading = ref(true);
    let chartMonthly = null;

    const load = async () => {
      try {
        data.value = await api.commissions();
        loading.value = false;
        await nextTick();
        renderChart();
      } catch (e) { console.error(e); loading.value = false; }
    };

    const renderChart = () => {
      const d = data.value;
      if (!d?.monthly?.length) return;
      const ctx = document.getElementById('chartMonthlyIncome');
      if (!ctx) return;
      if (chartMonthly) chartMonthly.destroy();
      const months = d.monthly;
      chartMonthly = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: months.map(m => fmtMonth(m.month)),
          datasets: [
            { label: 'K1 (₸)', data: months.map(m => m.k1_gross || 0), backgroundColor: 'rgba(37,99,235,.8)', borderRadius: 4, stack: 'a' },
            { label: 'K2 (₸)', data: months.map(m => m.k2_gross || 0), backgroundColor: 'rgba(124,58,237,.8)', borderRadius: 4, stack: 'a' },
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'top', labels: { font: { size: 12 }, padding: 12 } } },
          scales: {
            y: { stacked: true, ticks: { callback: v => '₸' + (v/1e6).toFixed(0) + 'М', font: { size: 11 } }, grid: { color: '#f1f5f9' } },
            x: { stacked: true, ticks: { font: { size: 11 } }, grid: { display: false } }
          }
        }
      });
    };

    const ytdTotal = computed(() => {
      if (!data.value?.monthly) return 0;
      const year = new Date().getFullYear();
      return data.value.monthly.filter(m => m.month?.startsWith(year)).reduce((s, m) => s + (m.total || 0), 0);
    });

    onMounted(load);
    return { data, loading, fmt, fmtPct, fmtMonth, calcYield, ytdTotal };
  },
  template: `
    <div>
      <div style="margin-bottom:28px">
        <h1 style="font-size:24px;font-weight:800;color:#0f172a">Доходность</h1>
        <p style="color:#64748b;font-size:14px;margin-top:4px">Комиссии K1 + K2 по месяцам</p>
      </div>

      <div v-if="loading" style="text-align:center;padding:80px"><div class="spinner"></div></div>

      <template v-else-if="data">
        <!-- KPIs -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px" class="grid-4">
          <div class="inv-card inv-metric" style="color:#2563eb">
            <div class="kpi-label">K1 всего</div>
            <div class="kpi-val">{{fmt(data.totals?.k1_gross, true)}}</div>
            <span class="kpi-badge badge-blue">Вознаграждение</span>
          </div>
          <div class="inv-card inv-metric" style="color:#7c3aed">
            <div class="kpi-label">K2 всего</div>
            <div class="kpi-val">{{fmt(data.totals?.k2_gross, true)}}</div>
            <span class="kpi-badge" style="background:#ede9fe;color:#7c3aed">За уступку</span>
          </div>
          <div class="inv-card inv-metric" style="color:#16a34a">
            <div class="kpi-label">Итого комиссий</div>
            <div class="kpi-val">{{fmt(data.totals?.total, true)}}</div>
            <span class="kpi-badge badge-green">Начислено</span>
          </div>
          <div class="inv-card inv-metric" style="color:#0891b2">
            <div class="kpi-label">YTD {{new Date().getFullYear()}}</div>
            <div class="kpi-val">{{fmt(ytdTotal, true)}}</div>
            <span class="kpi-badge" style="background:#cffafe;color:#0e7490">За год</span>
          </div>
        </div>

        <!-- Chart -->
        <div class="inv-card" style="padding:24px;margin-bottom:28px">
          <h3 style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:20px">K1 + K2 по месяцам</h3>
          <div style="height:260px"><canvas id="chartMonthlyIncome"></canvas></div>
        </div>

        <!-- Monthly table -->
        <div class="inv-card">
          <div style="padding:20px;border-bottom:1px solid #f1f5f9">
            <h3 style="font-size:15px;font-weight:700;color:#0f172a">Детализация по месяцам</h3>
          </div>
          <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr>
                  <th class="inv-th">Месяц</th>
                  <th class="inv-th" style="text-align:right">K1 (брутто)</th>
                  <th class="inv-th" style="text-align:right">K2 (брутто)</th>
                  <th class="inv-th" style="text-align:right">Итого</th>
                  <th class="inv-th" style="text-align:right">Доля от годового</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in [...data.monthly].reverse()" :key="m.month">
                  <td class="inv-td" style="font-weight:600">{{fmtMonth(m.month)}}</td>
                  <td class="inv-td" style="text-align:right;color:#2563eb">{{fmt(m.k1_gross, true)}}</td>
                  <td class="inv-td" style="text-align:right;color:#7c3aed">{{fmt(m.k2_gross, true)}}</td>
                  <td class="inv-td" style="text-align:right;font-weight:700">{{fmt(m.total, true)}}</td>
                  <td class="inv-td" style="text-align:right">
                    <span style="font-size:13px;color:#64748b">
                      {{data.totals?.total > 0 ? (m.total / data.totals.total * 100).toFixed(1) : '0'}}%
                    </span>
                  </td>
                </tr>
                <tr style="background:#f8fafc;font-weight:700">
                  <td class="inv-td">ИТОГО</td>
                  <td class="inv-td" style="text-align:right;color:#2563eb">{{fmt(data.totals?.k1_gross, true)}}</td>
                  <td class="inv-td" style="text-align:right;color:#7c3aed">{{fmt(data.totals?.k2_gross, true)}}</td>
                  <td class="inv-td" style="text-align:right;font-size:16px">{{fmt(data.totals?.total, true)}}</td>
                  <td class="inv-td" style="text-align:right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
  `
};
