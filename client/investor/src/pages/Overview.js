import { api } from '../api.js';
import { fmt, fmtPct, fmtDate, fmtMonth, calcYield } from '../utils.js';

export default {
  setup() {
    const { ref, onMounted, nextTick } = Vue;
    const data = ref(null);
    const loading = ref(true);
    let chartPortfolio = null, chartIncome = null;

    const load = async () => {
      try {
        data.value = await api.investorSummary();
        await nextTick();
        renderCharts();
      } catch (e) { console.error(e); }
      finally { loading.value = false; }
    };

    const renderCharts = () => {
      const d = data.value;

      // Portfolio by status pie
      const ctxPie = document.getElementById('chartStatus');
      if (ctxPie) {
        if (chartPortfolio) chartPortfolio.destroy();
        const statusLabels = { open:'Активно', overdue:'Просрочка', default:'Дефолт', closed:'Закрыто', draft:'Черновик' };
        const statusColors = { open:'#22c55e', overdue:'#f97316', default:'#ef4444', closed:'#3b82f6', draft:'#94a3b8' };
        const items = (d.byStatus || []).filter(s => s.od > 0);
        chartPortfolio = new Chart(ctxPie, {
          type: 'doughnut',
          data: {
            labels: items.map(s => statusLabels[s.status] || s.status),
            datasets: [{ data: items.map(s => s.od), backgroundColor: items.map(s => statusColors[s.status] || '#94a3b8'), borderWidth: 2, borderColor: '#fff' }]
          },
          options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 12 } } }, cutout: '70%' }
        });
      }

      // Monthly income bar
      const ctxBar = document.getElementById('chartIncome');
      if (ctxBar && d.monthlyNew?.length) {
        if (chartIncome) chartIncome.destroy();
        const labels = d.monthlyNew.map(m => fmtMonth(m.month));
        chartIncome = new Chart(ctxBar, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              { label: 'Объём выдачи (₸)', data: d.monthlyNew.map(m => m.volume || 0), backgroundColor: 'rgba(37,99,235,.75)', borderRadius: 6 },
            ]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { ticks: { callback: v => '₸' + (v/1e6).toFixed(0) + 'М', font: { size: 11 } }, grid: { color: '#f1f5f9' } },
              x: { ticks: { font: { size: 11 } }, grid: { display: false } }
            }
          }
        });
      }
    };

    onMounted(load);
    return { data, loading, fmt, fmtPct, fmtDate, fmtMonth, calcYield };
  },
  template: `
    <div>
      <div style="margin-bottom:28px">
        <h1 style="font-size:24px;font-weight:800;color:#0f172a">Обзор портфеля</h1>
        <p style="color:#64748b;font-size:14px;margin-top:4px">Данные на 21 марта 2026 года</p>
      </div>

      <div v-if="loading" style="text-align:center;padding:80px"><div class="spinner"></div></div>

      <template v-else-if="data">
        <!-- KPI Grid -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px" class="grid-4">

          <div class="inv-card inv-metric" style="color:#2563eb">
            <div class="kpi-label">Всего выдано</div>
            <div class="kpi-val">{{fmt(data.portfolio?.total_financed, true)}}</div>
            <div class="kpi-sub">{{data.portfolio?.total_deals}} сделок за всё время</div>
            <span class="kpi-badge badge-blue">Общий объём</span>
          </div>

          <div class="inv-card inv-metric" style="color:#16a34a">
            <div class="kpi-label">Активный ОД</div>
            <div class="kpi-val">{{fmt(data.portfolio?.active_od, true)}}</div>
            <div class="kpi-sub">{{data.portfolio?.active_deals}} активных финансирований</div>
            <span class="kpi-badge badge-green">▲ В работе</span>
          </div>

          <div class="inv-card inv-metric" style="color:#7c3aed">
            <div class="kpi-label">Комиссии K1+K2</div>
            <div class="kpi-val">{{fmt((data.portfolio?.total_k1||0)+(data.portfolio?.total_k2||0), true)}}</div>
            <div class="kpi-sub">K1: {{fmt(data.portfolio?.total_k1, true)}} | K2: {{fmt(data.portfolio?.total_k2, true)}}</div>
            <span class="kpi-badge" style="background:#ede9fe;color:#7c3aed">Начислено</span>
          </div>

          <div class="inv-card inv-metric" style="color:#0891b2">
            <div class="kpi-label">Закрыто сделок</div>
            <div class="kpi-val">{{data.portfolio?.closed_deals}}</div>
            <div class="kpi-sub">ВОП выплачен поставщикам</div>
            <span class="kpi-badge" style="background:#cffafe;color:#0e7490">Завершено</span>
          </div>
        </div>

        <!-- Secondary metrics -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px" class="grid-4">
          <div class="inv-card" style="padding:18px">
            <div class="kpi-label" style="margin-bottom:8px">Средний размер сделки</div>
            <div style="font-size:20px;font-weight:700;color:#0f172a">
              {{fmt(data.portfolio?.total_docs && data.portfolio?.total_deals ? data.portfolio.total_docs/data.portfolio.total_deals : 0, true)}}
            </div>
          </div>
          <div class="inv-card" style="padding:18px">
            <div class="kpi-label" style="margin-bottom:8px">Просрочка</div>
            <div style="font-size:20px;font-weight:700;color:#dc2626">{{data.portfolio?.overdue_deals}} сделок</div>
          </div>
          <div class="inv-card" style="padding:18px">
            <div class="kpi-label" style="margin-bottom:8px">ВОП (суммарно)</div>
            <div style="font-size:20px;font-weight:700;color:#16a34a">{{fmt(data.vopStats?.total_vop_positive, true)}}</div>
          </div>
          <div class="inv-card" style="padding:18px">
            <div class="kpi-label" style="margin-bottom:8px">Доходность портфеля</div>
            <div style="font-size:20px;font-weight:700;color:#2563eb">
              {{calcYield((data.portfolio?.total_k1||0)+(data.portfolio?.total_k2||0), data.portfolio?.total_financed)}}%
            </div>
          </div>
        </div>

        <!-- Charts row -->
        <div style="display:grid;grid-template-columns:1fr 2fr;gap:20px;margin-bottom:28px" class="grid-2">
          <!-- Doughnut -->
          <div class="inv-card" style="padding:24px">
            <h3 style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:20px">Структура по ОД</h3>
            <canvas id="chartStatus" height="200"></canvas>
            <!-- Legend numbers -->
            <div style="margin-top:16px;display:flex;flex-direction:column;gap:8px">
              <div v-for="s in data.byStatus" :key="s.status" style="display:flex;justify-content:space-between;font-size:13px">
                <span>{{{'open':'Активно','overdue':'Просрочка','default':'Дефолт','closed':'Закрыто','draft':'Черновик'}[s.status]||s.status}}</span>
                <span style="font-weight:700">{{s.cnt}} сделок</span>
              </div>
            </div>
          </div>

          <!-- Bar chart monthly -->
          <div class="inv-card" style="padding:24px">
            <h3 style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:20px">Объём выдачи по месяцам</h3>
            <div style="height:220px">
              <canvas id="chartIncome"></canvas>
            </div>
          </div>
        </div>

        <!-- Upcoming repayments -->
        <div class="inv-card" style="margin-bottom:28px">
          <div style="padding:20px;border-bottom:1px solid #f1f5f9">
            <h3 style="font-size:15px;font-weight:700;color:#0f172a">Ближайшие гашения</h3>
          </div>
          <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr>
                  <th class="inv-th">Клиент</th>
                  <th class="inv-th">Дебитор</th>
                  <th class="inv-th">ОД</th>
                  <th class="inv-th">Плановое гашение</th>
                  <th class="inv-th">Статус</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="f in data.upcoming" :key="f.id">
                  <td class="inv-td" style="font-weight:600">{{f.client_name}}</td>
                  <td class="inv-td" style="color:#64748b">{{f.debtor_name}}</td>
                  <td class="inv-td" style="text-align:right;font-weight:700;color:#dc2626">{{fmt(f.current_od)}}</td>
                  <td class="inv-td">{{fmtDate(f.planned_repayment)}}</td>
                  <td class="inv-td">
                    <span v-if="f.days_overdue>0" class="tag tag-red">Просрочка {{f.days_overdue}} дн.</span>
                    <span v-else class="tag tag-green">В срок</span>
                  </td>
                </tr>
                <tr v-if="!data.upcoming?.length">
                  <td class="inv-td" colspan="5" style="text-align:center;color:#94a3b8">Нет данных</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
  `
};
