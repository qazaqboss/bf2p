import { api } from '../api.js';
import { fmt, fmtPct } from '../utils.js';

export default {
  setup() {
    const { ref, onMounted, nextTick } = Vue;
    const data = ref(null);
    const loading = ref(true);
    let chartClient = null, chartSeries = null;

    const load = async () => {
      try {
        data.value = await api.portfolio();
        await nextTick();
        renderCharts();
      } catch (e) { console.error(e); }
      finally { loading.value = false; }
    };

    const renderCharts = () => {
      const d = data.value;

      const ctxClient = document.getElementById('chartByClient');
      if (ctxClient && d.by_client?.length) {
        if (chartClient) chartClient.destroy();
        chartClient = new Chart(ctxClient, {
          type: 'bar',
          data: {
            labels: d.by_client.map(([name]) => name.length > 18 ? name.slice(0, 18) + '…' : name),
            datasets: [{ label: 'ОД (₸)', data: d.by_client.map(([, v]) => v), backgroundColor: '#3b82f6', borderRadius: 4 }]
          },
          options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { callback: v => '₸' + (v/1e6).toFixed(0) + 'М', font: { size: 10 } }, grid: { color: '#f1f5f9' } },
              y: { ticks: { font: { size: 11 } } }
            }
          }
        });
      }

      const ctxSeries = document.getElementById('chartBySeries');
      if (ctxSeries && d.by_series?.length) {
        if (chartSeries) chartSeries.destroy();
        const colors = { F1:'#8b5cf6', F2:'#3b82f6', F3:'#10b981', F4:'#f59e0b', F5:'#ef4444', F6:'#ec4899' };
        chartSeries = new Chart(ctxSeries, {
          type: 'doughnut',
          data: {
            labels: d.by_series.map(([s]) => s),
            datasets: [{ data: d.by_series.map(([, v]) => v), backgroundColor: d.by_series.map(([s]) => colors[s] || '#94a3b8'), borderWidth: 2, borderColor: '#fff' }]
          },
          options: { responsive: true, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 10 } } } }
        });
      }
    };

    onMounted(load);
    return { data, loading, fmt, fmtPct };
  },
  template: `
    <div>
      <div style="margin-bottom:28px">
        <h1 style="font-size:24px;font-weight:800;color:#0f172a">Портфель</h1>
        <p style="color:#64748b;font-size:14px;margin-top:4px">Активные финансирования</p>
      </div>

      <div v-if="loading" style="text-align:center;padding:80px"><div class="spinner"></div></div>

      <template v-else-if="data">
        <!-- Summary KPIs -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:28px" class="grid-4">
          <div class="inv-card inv-metric" style="color:#2563eb">
            <div class="kpi-label">Активных финансирований</div>
            <div class="kpi-val">{{data.count}}</div>
            <span class="kpi-badge badge-blue">В портфеле</span>
          </div>
          <div class="inv-card inv-metric" style="color:#16a34a">
            <div class="kpi-label">Суммарный ОД</div>
            <div class="kpi-val">{{fmt(data.total_od, true)}}</div>
            <span class="kpi-badge badge-green">Основной долг</span>
          </div>
          <div class="inv-card inv-metric" style="color:#7c3aed">
            <div class="kpi-label">Сумма документов</div>
            <div class="kpi-val">{{fmt(data.total_docs, true)}}</div>
            <span class="kpi-badge" style="background:#ede9fe;color:#7c3aed">Уступки</span>
          </div>
        </div>

        <!-- Charts row -->
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px;margin-bottom:28px" class="grid-2">
          <!-- Top clients bar -->
          <div class="inv-card" style="padding:24px">
            <h3 style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:20px">ОД по клиентам (топ-10)</h3>
            <div style="height:280px"><canvas id="chartByClient"></canvas></div>
          </div>
          <!-- By series doughnut -->
          <div class="inv-card" style="padding:24px">
            <h3 style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:20px">По тарифным сериям</h3>
            <canvas id="chartBySeries" height="220"></canvas>
            <div style="margin-top:12px;display:flex;flex-direction:column;gap:6px">
              <div v-for="[series, od] in data.by_series" :key="series" style="display:flex;justify-content:space-between;font-size:13px">
                <span style="font-weight:600">{{series}}</span>
                <span style="color:#64748b">{{fmt(od, true)}}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Status breakdown -->
        <div class="inv-card" style="padding:24px;margin-bottom:28px">
          <h3 style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:20px">Разбивка по статусам</h3>
          <div style="display:flex;gap:24px;flex-wrap:wrap">
            <div v-for="[status, od] in data.by_status" :key="status" style="display:flex;flex-direction:column;align-items:center;gap:8px;min-width:120px">
              <div style="font-size:28px;font-weight:800;color:#0f172a">{{fmt(od, true)}}</div>
              <span :class="['tag', status==='open'?'tag-green':status==='overdue'?'tag-amber':status==='default'?'tag-red':'tag-blue']">
                {{'open'==='open'&&status==='open'?'Активно':'overdue'===status?'Просрочка':'default'===status?'Дефолт':'Закрыто'}}
              </span>
            </div>
          </div>
        </div>

        <!-- By client table -->
        <div class="inv-card">
          <div style="padding:20px;border-bottom:1px solid #f1f5f9">
            <h3 style="font-size:15px;font-weight:700;color:#0f172a">Топ-10 клиентов по ОД</h3>
          </div>
          <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr>
                  <th class="inv-th">#</th>
                  <th class="inv-th">Клиент</th>
                  <th class="inv-th" style="text-align:right">Основной долг</th>
                  <th class="inv-th" style="text-align:right">Доля</th>
                  <th class="inv-th">Уровень</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="([name, od], i) in data.by_client" :key="name">
                  <td class="inv-td" style="color:#94a3b8;font-size:12px">{{i+1}}</td>
                  <td class="inv-td" style="font-weight:600">{{name}}</td>
                  <td class="inv-td" style="text-align:right;font-weight:700;color:#2563eb">{{fmt(od, true)}}</td>
                  <td class="inv-td" style="text-align:right">
                    <span style="font-size:13px;color:#64748b">{{data.total_od > 0 ? (od/data.total_od*100).toFixed(1) : '0'}}%</span>
                    <div class="prog-bar" style="margin-top:4px;width:80px">
                      <div class="prog-fill" :style="{width: data.total_od>0 ? (od/data.total_od*100)+'%' : '0', background:'#3b82f6'}"></div>
                    </div>
                  </td>
                  <td class="inv-td">
                    <span :class="['tag', od > 50e6 ? 'tag-red' : od > 20e6 ? 'tag-amber' : 'tag-green']">
                      {{od > 50e6 ? 'Крупный' : od > 20e6 ? 'Средний' : 'Малый'}}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
  `
};
