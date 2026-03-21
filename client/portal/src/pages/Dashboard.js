import { api } from '../api.js';
import { fmt, fmtDate, fmtPct, daysUntil } from '../utils.js';

export default {
  setup() {
    const { ref, onMounted } = Vue;
    const data = ref(null);
    const profile = ref(null);
    const loading = ref(true);

    const load = async () => {
      try {
        const [s, p] = await Promise.all([api.stats(), api.profile()]);
        data.value = s;
        profile.value = p;
      } catch (e) { console.error(e); }
      finally { loading.value = false; }
    };

    onMounted(load);
    return { data, profile, loading, fmt, fmtDate, fmtPct, daysUntil };
  },
  template: `
    <div>
      <!-- Welcome header -->
      <div style="margin-bottom:28px;display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
        <div>
          <h1 style="font-size:24px;font-weight:800;color:#0f172a">
            Добро пожаловать, {{profile?.client?.name || '...'}}
          </h1>
          <p style="color:#64748b;font-size:14px;margin-top:4px">
            БИН: {{profile?.client?.bin}} &nbsp;·&nbsp; Менеджер: {{profile?.client?.manager || '—'}}
            &nbsp;·&nbsp; {{new Date().toLocaleDateString('ru-RU', {day:'numeric',month:'long',year:'numeric'})}}
          </p>
        </div>
        <!-- Agreement badge -->
        <div v-if="profile?.agreement" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:12px 18px;text-align:right;flex-shrink:0">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#3b82f6">Генеральный договор</div>
          <div style="font-size:15px;font-weight:700;color:#1e3a8a;margin-top:2px">{{profile.agreement.number}}</div>
          <div style="font-size:12px;color:#64748b;margin-top:2px">
            Тариф: <span style="font-weight:600;color:#2563eb">{{profile.agreement.tariff_name}}</span>
          </div>
        </div>
      </div>

      <div v-if="loading" style="text-align:center;padding:80px"><div class="spinner"></div></div>

      <template v-else-if="data">
        <!-- Alert: overdue -->
        <div v-if="data.stats?.overdue_deals > 0" class="cl-alert cl-alert-warn" style="margin-bottom:20px">
          ⚠️ У вас <strong>{{data.stats.overdue_deals}} просроченных</strong> финансирований. Пожалуйста, свяжитесь с вашим менеджером.
        </div>

        <!-- KPI Grid -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px" class="grid-4">
          <div class="cl-card cl-metric" style="color:#2563eb">
            <div class="kpi-label">Всего выдано</div>
            <div class="kpi-val">{{fmt(data.stats?.total_financed, true)}}</div>
            <div class="kpi-sub">{{data.stats?.total_deals}} сделок</div>
            <span class="kpi-badge" style="background:#dbeafe;color:#1d4ed8">Общий объём</span>
          </div>
          <div class="cl-card cl-metric" style="color:#16a34a">
            <div class="kpi-label">Активный долг</div>
            <div class="kpi-val">{{fmt(data.stats?.active_od, true)}}</div>
            <div class="kpi-sub">{{data.stats?.active_deals}} активных</div>
            <span class="kpi-badge" style="background:#dcfce7;color:#15803d">В работе</span>
          </div>
          <div class="cl-card cl-metric" style="color:#7c3aed">
            <div class="kpi-label">Комиссии начислено</div>
            <div class="kpi-val">{{fmt(data.stats?.total_commissions, true)}}</div>
            <div class="kpi-sub">K1 + K2 за всё время</div>
            <span class="kpi-badge" style="background:#ede9fe;color:#7c3aed">Начислено</span>
          </div>
          <div class="cl-card cl-metric" style="color:#0891b2">
            <div class="kpi-label">ВОП выплачено</div>
            <div class="kpi-val">{{fmt(data.stats?.total_vop, true)}}</div>
            <div class="kpi-sub">{{data.stats?.closed_deals}} закрытых сделок</div>
            <span class="kpi-badge" style="background:#cffafe;color:#0e7490">Возврат</span>
          </div>
        </div>

        <!-- Tariff info block -->
        <div v-if="profile?.agreement" class="cl-card" style="padding:24px;margin-bottom:24px">
          <h3 style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:16px">Ваш тарифный план — {{profile.agreement.tariff_name}}</h3>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px">
            <div style="background:#f8fbff;border-radius:10px;padding:14px">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:4px">K1 — вознаграждение</div>
              <div style="font-size:22px;font-weight:800;color:#2563eb">{{fmtPct((profile.agreement.k1_rate||0)*100)}} год.</div>
              <div style="font-size:12px;color:#64748b;margin-top:2px">начисляется ежедневно на ОД</div>
            </div>
            <div v-if="profile.agreement.k2_rate_0_30" style="background:#f8fbff;border-radius:10px;padding:14px">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:4px">K2 — за уступку (0–30 дн.)</div>
              <div style="font-size:22px;font-weight:800;color:#7c3aed">{{fmtPct(profile.agreement.k2_rate_0_30)}}%</div>
              <div style="font-size:12px;color:#64748b;margin-top:2px">от суммы документа</div>
            </div>
            <div v-if="profile.agreement.k2_rate_30_60" style="background:#f8fbff;border-radius:10px;padding:14px">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:4px">K2 (30–60 дн.)</div>
              <div style="font-size:22px;font-weight:800;color:#7c3aed">{{fmtPct(profile.agreement.k2_rate_30_60)}}%</div>
            </div>
            <div style="background:#f8fbff;border-radius:10px;padding:14px">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:4px">Дисконт финансирования</div>
              <div style="font-size:22px;font-weight:800;color:#0891b2">{{fmtPct((profile.agreement.default_discount||0.85)*100, 0)}}%</div>
              <div style="font-size:12px;color:#64748b;margin-top:2px">аванс от суммы документа</div>
            </div>
            <div v-if="profile.agreement.credit_limit" style="background:#f8fbff;border-radius:10px;padding:14px">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#94a3b8;margin-bottom:4px">Лимит по договору</div>
              <div style="font-size:22px;font-weight:800;color:#16a34a">{{fmt(profile.agreement.credit_limit, true)}}</div>
            </div>
          </div>
        </div>

        <!-- Upcoming repayments -->
        <div class="cl-card" style="margin-bottom:24px">
          <div style="padding:20px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center">
            <h3 style="font-size:15px;font-weight:700;color:#0f172a">Ближайшие гашения</h3>
            <span style="font-size:12px;color:#64748b">Активные финансирования</span>
          </div>
          <div v-if="data.upcoming?.length" style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr>
                  <th class="cl-th">Дебитор</th>
                  <th class="cl-th">АВР №</th>
                  <th class="cl-th" style="text-align:right">ОД</th>
                  <th class="cl-th">Дата гашения</th>
                  <th class="cl-th">Статус</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="f in data.upcoming" :key="f.id">
                  <td class="cl-td" style="font-weight:600">{{f.debtor_name}}</td>
                  <td class="cl-td" style="font-size:12px;color:#64748b">{{f.notice_number || f.number}}</td>
                  <td class="cl-td" style="text-align:right;font-weight:700;color:#dc2626">{{fmt(f.current_od)}}</td>
                  <td class="cl-td">
                    <span style="font-size:13px">{{fmtDate(f.planned_repayment)}}</span>
                    <span v-if="daysUntil(f.planned_repayment) !== null && daysUntil(f.planned_repayment) > 0" style="font-size:11px;color:#94a3b8;margin-left:6px">
                      (через {{daysUntil(f.planned_repayment)}} дн.)
                    </span>
                  </td>
                  <td class="cl-td">
                    <span v-if="f.status==='open'" class="tag tag-green">В срок</span>
                    <span v-else-if="f.status==='overdue'" class="tag tag-amber">Просрочка {{f.days_overdue}} дн.</span>
                    <span v-else-if="f.status==='default'" class="tag tag-red">Дефолт</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else style="padding:40px;text-align:center;color:#94a3b8;font-size:14px">
            Нет активных финансирований
          </div>
        </div>

        <!-- Status breakdown -->
        <div v-if="data.byStatus?.length" class="cl-card" style="padding:24px">
          <h3 style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:16px">Разбивка по статусам</h3>
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <div v-for="s in data.byStatus" :key="s.status" class="cl-card" style="padding:16px 20px;min-width:140px;flex:1">
              <div style="font-size:24px;font-weight:800;color:#0f172a">{{s.cnt}}</div>
              <div style="font-size:13px;color:#64748b;margin-top:2px">
                {{'open'===s.status?'Активных':'overdue'===s.status?'Просрочка':'default'===s.status?'Дефолт':'closed'===s.status?'Закрытых':'Черновиков'}}
              </div>
              <div style="font-size:12px;font-weight:600;margin-top:4px"
                :style="{color: s.status==='open'?'#16a34a':s.status==='overdue'?'#b45309':s.status==='default'?'#dc2626':s.status==='closed'?'#2563eb':'#94a3b8'}">
                {{s.od > 0 ? fmt(s.od, true) : ''}}
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  `
};
