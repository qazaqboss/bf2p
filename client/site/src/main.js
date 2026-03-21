import { api } from './api.js';
import { fmt, fmtDate, fmtPct, daysUntil, today } from './utils.js';

const { createApp, ref, computed, onMounted, watch, nextTick } = Vue;

const DEMO_ACCOUNTS = [
  { name: 'ТОО «Гранат»',               email: 'granit@swiss.kz' },
  { name: 'ТОО «Aurora»',               email: 'aurora@swiss.kz' },
  { name: 'ТОО «КомпИнвестСтр»',        email: 'kompinvest@swiss.kz' },
  { name: 'ТОО «Контроль-Сервис ЛТД»',  email: 'kontrol@swiss.kz' },
  { name: 'ТОО «КазМет»',               email: 'kazmet@swiss.kz' },
];

/* ============================================================
   CABINET PAGES (inline components)
============================================================ */

const CabDashboard = {
  setup() {
    const data = ref(null);
    const profile = ref(null);
    const loading = ref(true);
    onMounted(async () => {
      try {
        const [s, p] = await Promise.all([api.stats(), api.profile()]);
        data.value = s; profile.value = p;
      } catch (e) { console.error(e); }
      finally { loading.value = false; }
    });
    return { data, profile, loading, fmt, fmtDate, fmtPct, daysUntil };
  },
  template: `
    <div>
      <div style="margin-bottom:28px;display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
        <div>
          <h1 style="font-size:24px;font-weight:800;color:#0f172a">Добро пожаловать, {{profile?.client?.name || '...'}}</h1>
          <p style="color:#64748b;font-size:14px;margin-top:4px">
            БИН: {{profile?.client?.bin}} &nbsp;·&nbsp; Менеджер: {{profile?.client?.manager || '—'}}
            &nbsp;·&nbsp; {{new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'})}}
          </p>
        </div>
        <div v-if="profile?.agreement" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:12px 18px;text-align:right;flex-shrink:0">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#3b82f6">Генеральный договор</div>
          <div style="font-size:15px;font-weight:700;color:#1e3a8a;margin-top:2px">{{profile.agreement.number}}</div>
          <div style="font-size:12px;color:#64748b;margin-top:2px">Тариф: <span style="font-weight:600;color:#2563eb">{{profile.agreement.tariff_name}}</span></div>
        </div>
      </div>

      <div v-if="loading" style="text-align:center;padding:80px"><div class="spinner"></div></div>

      <template v-else-if="data">
        <div v-if="data.stats?.overdue_deals > 0" class="cl-alert cl-alert-warn" style="margin-bottom:20px">
          ⚠️ У вас <strong>{{data.stats.overdue_deals}} просроченных</strong> финансирований. Пожалуйста, свяжитесь с вашим менеджером.
        </div>

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

        <div class="cl-card" style="margin-bottom:24px">
          <div style="padding:20px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center">
            <h3 style="font-size:15px;font-weight:700;color:#0f172a">Ближайшие гашения</h3>
            <span style="font-size:12px;color:#64748b">Активные финансирования</span>
          </div>
          <div v-if="data.upcoming?.length" style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse">
              <thead><tr>
                <th class="cl-th">Дебитор</th>
                <th class="cl-th">АВР №</th>
                <th class="cl-th" style="text-align:right">ОД</th>
                <th class="cl-th">Дата гашения</th>
                <th class="cl-th">Статус</th>
              </tr></thead>
              <tbody>
                <tr v-for="f in data.upcoming" :key="f.id">
                  <td class="cl-td" style="font-weight:600">{{f.debtor_name}}</td>
                  <td class="cl-td" style="font-size:12px;color:#64748b">{{f.notice_number || f.number}}</td>
                  <td class="cl-td" style="text-align:right;font-weight:700;color:#dc2626">{{fmt(f.current_od)}}</td>
                  <td class="cl-td">
                    <span style="font-size:13px">{{fmtDate(f.planned_repayment)}}</span>
                    <span v-if="daysUntil(f.planned_repayment) > 0" style="font-size:11px;color:#94a3b8;margin-left:6px">(через {{daysUntil(f.planned_repayment)}} дн.)</span>
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
          <div v-else style="padding:40px;text-align:center;color:#94a3b8;font-size:14px">Нет активных финансирований</div>
        </div>

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

const CabFinancings = {
  emits: ['detail'],
  setup(props, { emit }) {
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
    onMounted(async () => {
      try { const d = await api.financings(); items.value = d.items || []; }
      catch (e) { console.error(e); }
      finally { loading.value = false; }
    });
    return { items, loading, filter, search, tabs, counts, filtered, totalOD, fmt, fmtDate, emit };
  },
  template: `
    <div>
      <div style="margin-bottom:28px">
        <h1 style="font-size:24px;font-weight:800;color:#0f172a">Мои финансирования</h1>
        <p style="color:#64748b;font-size:14px;margin-top:4px">История всех сделок по факторингу</p>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:18px">
        <button v-for="t in tabs" :key="t.key" @click="filter=t.key"
          :style="filter===t.key ? 'background:#2563eb;color:#fff;border-color:#2563eb' : 'background:#fff;color:#64748b;border-color:#e2e8f0'"
          style="padding:7px 14px;border-radius:8px;border:1px solid;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s">
          {{t.label}} <span style="opacity:.7;margin-left:3px">({{counts[t.key]||0}})</span>
        </button>
      </div>
      <div style="margin-bottom:18px">
        <input v-model="search" placeholder="Поиск по дебитору, номеру АВР..."
          style="width:100%;max-width:380px;padding:9px 14px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;background:#fff"/>
      </div>
      <div v-if="loading" style="text-align:center;padding:60px"><div class="spinner"></div></div>
      <div v-else class="cl-card">
        <div style="padding:14px 20px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
          <span style="font-size:13px;color:#64748b">Показано: <strong style="color:#0f172a">{{filtered.length}}</strong></span>
          <span style="font-size:13px;color:#64748b">Активный ОД: <strong style="color:#2563eb">{{fmt(totalOD, true)}}</strong></span>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse">
            <thead><tr>
              <th class="cl-th">Номер</th>
              <th class="cl-th">Дебитор</th>
              <th class="cl-th">АВР</th>
              <th class="cl-th" style="text-align:right">Сумма финанс.</th>
              <th class="cl-th" style="text-align:right">ОД</th>
              <th class="cl-th">Гашение</th>
              <th class="cl-th">Статус</th>
              <th class="cl-th"></th>
            </tr></thead>
            <tbody>
              <tr v-for="f in filtered" :key="f.id" style="cursor:pointer" @click="$emit('detail', f.id)">
                <td class="cl-td" style="font-size:12px;color:#94a3b8;font-weight:600">{{f.number}}</td>
                <td class="cl-td" style="font-weight:600;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{f.debtor_name}}</td>
                <td class="cl-td" style="font-size:12px;color:#64748b;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{f.avr_number || '—'}}</td>
                <td class="cl-td" style="text-align:right;white-space:nowrap">{{fmt(f.financing_sum)}}</td>
                <td class="cl-td" style="text-align:right;font-weight:700;white-space:nowrap" :style="{color: f.current_od > 0 ? '#dc2626' : '#16a34a'}">{{fmt(f.current_od)}}</td>
                <td class="cl-td" style="white-space:nowrap;font-size:13px">{{fmtDate(f.planned_repayment)}}</td>
                <td class="cl-td">
                  <span v-if="f.status==='open'" class="tag tag-green">Активно</span>
                  <span v-else-if="f.status==='overdue'" class="tag tag-amber">Просрочка</span>
                  <span v-else-if="f.status==='default'" class="tag tag-red">Дефолт</span>
                  <span v-else-if="f.status==='closed'" class="tag tag-blue">Закрыто</span>
                  <span v-else class="tag tag-gray">Черновик</span>
                </td>
                <td class="cl-td" style="text-align:right"><span style="color:#2563eb;font-size:13px;font-weight:600">Подробнее →</span></td>
              </tr>
              <tr v-if="!filtered.length"><td class="cl-td" colspan="8" style="text-align:center;color:#94a3b8;padding:40px">Нет данных</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
};

const CabFinancingDetail = {
  props: ['finId'],
  emits: ['back'],
  setup(props) {
    const data = ref(null);
    const loading = ref(true);
    const opLabel = { issue: 'Выдача', additional_issue: 'Доп. выдача', chd: 'ЧДГ', full_repayment: 'Полное погашение', vop_transfer: 'Перевод ВОП', correction: 'Корректировка' };
    onMounted(async () => {
      try { data.value = await api.financing(props.finId); }
      catch (e) { console.error(e); }
      finally { loading.value = false; }
    });
    return { data, loading, fmt, fmtDate, fmtPct, opLabel };
  },
  template: `
    <div>
      <button @click="$emit('back')" style="display:inline-flex;align-items:center;gap:6px;color:#2563eb;font-size:14px;font-weight:600;background:none;border:none;cursor:pointer;margin-bottom:24px;padding:0">
        ← Назад к списку
      </button>
      <div v-if="loading" style="text-align:center;padding:80px"><div class="spinner"></div></div>
      <template v-else-if="data">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;margin-bottom:24px">
          <div>
            <div style="font-size:13px;color:#94a3b8;font-weight:600;margin-bottom:4px">Финансирование</div>
            <h1 style="font-size:26px;font-weight:800;color:#0f172a;margin-bottom:6px">{{data.fin.number}}</h1>
            <p style="color:#64748b;font-size:14px">
              Дебитор: <strong>{{data.fin.debtor_name}}</strong>
              <span style="margin-left:12px">БИН: {{data.fin.debtor_bin}}</span>
            </p>
          </div>
          <div>
            <span v-if="data.fin.status==='open'" class="tag tag-green" style="font-size:14px;padding:6px 16px">● Активно</span>
            <span v-else-if="data.fin.status==='overdue'" class="tag tag-amber" style="font-size:14px;padding:6px 16px">⚠ Просрочка {{data.fin.days_overdue}} дн.</span>
            <span v-else-if="data.fin.status==='default'" class="tag tag-red" style="font-size:14px;padding:6px 16px">✕ Дефолт</span>
            <span v-else-if="data.fin.status==='closed'" class="tag tag-blue" style="font-size:14px;padding:6px 16px">✓ Закрыто</span>
            <span v-else class="tag tag-gray" style="font-size:14px;padding:6px 16px">Черновик</span>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px" class="grid-4">
          <div class="cl-card cl-metric" style="color:#2563eb">
            <div class="kpi-label">Сумма документа</div>
            <div class="kpi-val">{{fmt(data.fin.document_sum, true)}}</div>
            <div class="kpi-sub">АВР: {{data.fin.avr_number}}</div>
          </div>
          <div class="cl-card cl-metric" style="color:#16a34a">
            <div class="kpi-label">Получено финансирование</div>
            <div class="kpi-val">{{fmt(data.fin.financing_sum, true)}}</div>
            <div class="kpi-sub">Дисконт {{fmtPct(data.fin.discount*100, 0)}}</div>
          </div>
          <div class="cl-card cl-metric" style="color:#dc2626">
            <div class="kpi-label">Текущий ОД</div>
            <div class="kpi-val">{{fmt(data.fin.current_od, true)}}</div>
            <div class="kpi-sub">Основной долг</div>
          </div>
          <div class="cl-card cl-metric" style="color:#7c3aed">
            <div class="kpi-label">Комиссии (K1+K2)</div>
            <div class="kpi-val">{{fmt((data.fin.k1_accrued_net||0)+(data.fin.k2_accrued_net||0), true)}}</div>
            <div class="kpi-sub">Начислено без НДС</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px" class="grid-2">
          <div class="cl-card" style="padding:24px">
            <h3 style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:16px">📄 Реквизиты документа</h3>
            <div style="display:flex;flex-direction:column;gap:10px">
              <div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:#64748b">АВР №</span><span style="font-weight:600">{{data.fin.avr_number || '—'}}</span></div>
              <div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:#64748b">Дата АВР</span><span style="font-weight:600">{{fmtDate(data.fin.avr_date)}}</span></div>
              <div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:#64748b">Уведомление</span><span style="font-weight:600;font-size:12px">{{data.fin.notice_number || '—'}}</span></div>
              <div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:#64748b">Тариф</span><span class="tag tag-violet">{{data.fin.tariff_name}}</span></div>
              <div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:#64748b">Тип факторинга</span><span style="font-weight:600">{{data.fin.factoring_type==='with_notice'?'С уведомлением':'Без уведомления'}}</span></div>
            </div>
          </div>
          <div class="cl-card" style="padding:24px">
            <h3 style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:16px">📅 Сроки и комиссии</h3>
            <div style="display:flex;flex-direction:column;gap:10px">
              <div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:#64748b">Дата финансирования</span><span style="font-weight:600">{{fmtDate(data.fin.date_financing)}}</span></div>
              <div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:#64748b">Отсрочка</span><span style="font-weight:600">{{data.fin.installment_days}} дней</span></div>
              <div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:#64748b">Плановое гашение</span><span style="font-weight:600;color:#2563eb">{{fmtDate(data.fin.planned_repayment)}}</span></div>
              <div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:#64748b">K1 начислено (без НДС)</span><span style="font-weight:600">{{fmt(data.fin.k1_accrued_net)}}</span></div>
              <div style="display:flex;justify-content:space-between;font-size:13px"><span style="color:#64748b">K2 начислено (без НДС)</span><span style="font-weight:600">{{fmt(data.fin.k2_accrued_net)}}</span></div>
              <div v-if="data.fin.vop" style="display:flex;justify-content:space-between;font-size:13px;padding-top:8px;border-top:1px solid #f1f5f9">
                <span style="color:#64748b">ВОП</span>
                <span :style="{fontWeight:700, color: data.fin.vop > 0 ? '#16a34a' : '#dc2626'}">{{fmt(data.fin.vop)}}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="cl-card">
          <div style="padding:20px;border-bottom:1px solid #f1f5f9"><h3 style="font-size:15px;font-weight:700;color:#0f172a">История операций</h3></div>
          <div v-if="data.operations?.length" style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse">
              <thead><tr>
                <th class="cl-th">Дата</th>
                <th class="cl-th">Операция</th>
                <th class="cl-th" style="text-align:right">Сумма</th>
                <th class="cl-th" style="text-align:right">K1</th>
                <th class="cl-th" style="text-align:right">K2</th>
                <th class="cl-th" style="text-align:right">ОД уплачено</th>
                <th class="cl-th" style="text-align:right">ОД после</th>
                <th class="cl-th">Примечание</th>
              </tr></thead>
              <tbody>
                <tr v-for="op in data.operations" :key="op.id">
                  <td class="cl-td" style="white-space:nowrap;font-size:13px">{{fmtDate(op.operation_date)}}</td>
                  <td class="cl-td">
                    <span :class="['tag', op.type==='issue'?'tag-blue':op.type==='full_repayment'?'tag-green':op.type==='chd'?'tag-violet':'tag-gray']">
                      {{opLabel[op.type] || op.type}}
                    </span>
                  </td>
                  <td class="cl-td" style="text-align:right;font-weight:700;white-space:nowrap">{{fmt(op.amount)}}</td>
                  <td class="cl-td" style="text-align:right;white-space:nowrap;color:#7c3aed">{{op.k1_paid > 0 ? fmt(op.k1_paid) : '—'}}</td>
                  <td class="cl-td" style="text-align:right;white-space:nowrap;color:#7c3aed">{{op.k2_paid > 0 ? fmt(op.k2_paid) : '—'}}</td>
                  <td class="cl-td" style="text-align:right;white-space:nowrap;color:#dc2626">{{op.od_paid > 0 ? fmt(op.od_paid) : '—'}}</td>
                  <td class="cl-td" style="text-align:right;font-weight:600;white-space:nowrap">{{op.od_after != null ? fmt(op.od_after) : '—'}}</td>
                  <td class="cl-td" style="font-size:12px;color:#94a3b8;max-width:180px">{{op.note || '—'}}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else style="padding:40px;text-align:center;color:#94a3b8">Операций нет</div>
        </div>
      </template>
    </div>
  `
};

const CabNewRequest = {
  setup() {
    const debtors = ref([]);
    const loading = ref(false);
    const sending = ref(false);
    const success = ref(null);
    const error = ref('');
    const profile = ref(null);
    const form = ref({ debtor_id: '', avr_number: '', avr_date: today(), document_sum: '', installment_days: '30', comment: '' });
    const selectedDebtor = computed(() => debtors.value.find(d => d.id === form.value.debtor_id));
    const agreement = computed(() => profile.value?.agreement);
    const discount = computed(() => agreement.value?.default_discount || 0.85);
    const financingPreview = computed(() => { const s = parseFloat(form.value.document_sum); return isNaN(s) ? 0 : Math.round(s * discount.value * 100) / 100; });
    const plannedDate = computed(() => {
      if (!form.value.avr_date || !form.value.installment_days) return '';
      const d = new Date(form.value.avr_date);
      d.setDate(d.getDate() + parseInt(form.value.installment_days));
      return d.toISOString().split('T')[0];
    });
    const canSubmit = computed(() => form.value.debtor_id && form.value.avr_number && form.value.avr_date && parseFloat(form.value.document_sum) > 0);
    const submit = async () => {
      error.value = ''; sending.value = true;
      try {
        const r = await api.submitRequest({ ...form.value, document_sum: parseFloat(form.value.document_sum), installment_days: parseInt(form.value.installment_days) });
        success.value = r;
        form.value = { debtor_id: '', avr_number: '', avr_date: today(), document_sum: '', installment_days: '30', comment: '' };
      } catch (e) { error.value = e.message || 'Ошибка при подаче заявки'; }
      finally { sending.value = false; }
    };
    onMounted(async () => {
      loading.value = true;
      try { const [d, p] = await Promise.all([api.debtors(), api.profile()]); debtors.value = d.debtors || []; profile.value = p; }
      catch {}
      finally { loading.value = false; }
    });
    return { debtors, loading, sending, success, error, form, selectedDebtor, agreement, discount, financingPreview, plannedDate, canSubmit, submit, fmt, fmtDate };
  },
  template: `
    <div>
      <div style="margin-bottom:28px">
        <h1 style="font-size:24px;font-weight:800;color:#0f172a">Подать заявку</h1>
        <p style="color:#64748b;font-size:14px;margin-top:4px">Заявка на финансирование по факторингу</p>
      </div>
      <div v-if="success" class="cl-alert cl-alert-success" style="margin-bottom:24px;font-size:15px">
        ✅ Заявка <strong>{{success.number}}</strong> успешно подана!
        <br><span style="font-size:13px;margin-top:6px;display:block">
          Сумма финансирования: <strong>{{fmt(success.financing_sum, true)}}</strong> &nbsp;·&nbsp;
          Плановое гашение: <strong>{{fmtDate(success.planned_repayment)}}</strong>
          <br>Наш менеджер свяжется с вами в течение 1–2 рабочих дней.
        </span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 380px;gap:24px;align-items:start" class="grid-2">
        <div class="cl-card" style="padding:32px">
          <h3 style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:24px">Данные АВР / накладной</h3>
          <div v-if="loading" style="text-align:center;padding:40px"><div class="spinner"></div></div>
          <template v-else>
            <div style="margin-bottom:20px">
              <label class="cl-label">Дебитор (покупатель) *</label>
              <select v-model="form.debtor_id" class="cl-select">
                <option value="">— Выберите дебитора —</option>
                <option v-for="d in debtors" :key="d.id" :value="d.id">{{d.name}} ({{d.bin}}) · Рейтинг: {{d.rating}}</option>
              </select>
              <div v-if="selectedDebtor" style="margin-top:8px;padding:10px 14px;background:#f0fdf4;border-radius:8px;font-size:13px">
                <span class="tag tag-green">Рейтинг {{selectedDebtor.rating}}</span>
                <span style="margin-left:10px;color:#64748b">{{selectedDebtor.industry}}</span>
                <span v-if="selectedDebtor.notification_signed" style="margin-left:10px;color:#16a34a;font-weight:600">✓ Уведомление подписано</span>
                <span v-else style="margin-left:10px;color:#b45309;font-weight:600">⚠ Не подписано</span>
              </div>
            </div>
            <div style="margin-bottom:20px">
              <label class="cl-label">Номер АВР / накладной *</label>
              <input v-model="form.avr_number" class="cl-input" placeholder="№0015 от 21.03.2026"/>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
              <div><label class="cl-label">Дата АВР *</label><input v-model="form.avr_date" type="date" class="cl-input"/></div>
              <div>
                <label class="cl-label">Отсрочка (дней) *</label>
                <select v-model="form.installment_days" class="cl-select">
                  <option value="15">15 дней</option><option value="30">30 дней</option>
                  <option value="45">45 дней</option><option value="60">60 дней</option>
                  <option value="90">90 дней</option><option value="120">120 дней</option>
                </select>
              </div>
            </div>
            <div style="margin-bottom:20px">
              <label class="cl-label">Сумма документа (₸) *</label>
              <input v-model="form.document_sum" type="number" class="cl-input" placeholder="5000000"/>
              <div v-if="financingPreview > 0" style="margin-top:8px;font-size:13px;color:#64748b">
                Предв. сумма финансирования: <strong style="color:#2563eb">{{fmt(financingPreview, true)}}</strong>
                <span style="color:#94a3b8"> (дисконт {{(discount*100).toFixed(0)}}%)</span>
              </div>
            </div>
            <div style="margin-bottom:28px">
              <label class="cl-label">Комментарий</label>
              <textarea v-model="form.comment" class="cl-input" rows="3" style="resize:vertical" placeholder="Дополнительная информация..."></textarea>
            </div>
            <div v-if="error" class="cl-alert cl-alert-error">{{error}}</div>
            <button @click="submit" :disabled="!canSubmit || sending" class="cl-btn cl-btn-primary" style="width:100%;font-size:15px;padding:14px" :style="{opacity: !canSubmit || sending ? .6 : 1}">
              {{sending ? 'Отправляем...' : '📤 Подать заявку'}}
            </button>
          </template>
        </div>
        <div style="display:flex;flex-direction:column;gap:16px">
          <div class="cl-card" style="padding:20px">
            <h4 style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:14px">📊 Предварительный расчёт</h4>
            <div style="display:flex;flex-direction:column;gap:10px;font-size:13px">
              <div style="display:flex;justify-content:space-between"><span style="color:#64748b">Сумма документа</span><span style="font-weight:600">{{fmt(parseFloat(form.document_sum)||0)}}</span></div>
              <div style="display:flex;justify-content:space-between"><span style="color:#64748b">Дисконт {{(discount*100).toFixed(0)}}%</span><span style="font-weight:600;color:#2563eb">{{fmt(financingPreview)}}</span></div>
              <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid #f1f5f9"><span style="color:#64748b">Плановое гашение</span><span style="font-weight:600;color:#0891b2">{{fmtDate(plannedDate)||'—'}}</span></div>
              <div v-if="agreement" style="display:flex;justify-content:space-between"><span style="color:#64748b">K1 ставка</span><span style="font-weight:600;color:#7c3aed">{{((agreement.k1_rate||0)*100).toFixed(1)}}% год.</span></div>
            </div>
          </div>
          <div class="cl-card" style="padding:20px">
            <h4 style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:14px">🚀 Как это работает</h4>
            <div style="display:flex;flex-direction:column;gap:12px">
              <div v-for="(step, i) in [{title:'Подаёте заявку',desc:'Заполняете форму с данными АВР'},{title:'Верификация',desc:'Менеджер проверяет (1–2 дня)'},{title:'Получаете деньги',desc:'Аванс на счёт в день выдачи'},{title:'Дебитор платит',desc:'Погашение по уведомлению'},{title:'Получаете ВОП',desc:'Остаток за вычетом комиссий'}]" :key="i" style="display:flex;gap:10px;align-items:flex-start">
                <div style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">{{i+1}}</div>
                <div><div style="font-size:13px;font-weight:700;color:#0f172a">{{step.title}}</div><div style="font-size:12px;color:#64748b;margin-top:2px">{{step.desc}}</div></div>
              </div>
            </div>
          </div>
          <div class="cl-card" style="padding:20px">
            <h4 style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:12px">📎 Документы</h4>
            <ul style="font-size:13px;color:#64748b;padding-left:18px;margin:0;line-height:1.8">
              <li>АВР или товарная накладная</li>
              <li>Счёт-фактура (ЭСФ)</li>
              <li>Договор поставки с дебитором</li>
              <li>Доверенность (если нужна)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `
};

const CabInfo = {
  template: `
    <div>
      <h1 style="font-size:24px;font-weight:800;color:#0f172a;margin-bottom:6px">О факторинге</h1>
      <p style="color:#64748b;font-size:14px;margin-bottom:32px">Полное руководство по работе с Swiss Factoring</p>

      <div style="display:grid;gap:20px">
        <div class="cl-card" style="padding:28px">
          <h2 style="font-size:18px;font-weight:800;color:#0f172a;margin-bottom:14px">💡 Что такое факторинг?</h2>
          <p style="font-size:14px;color:#475569;line-height:1.8;margin-bottom:12px">
            Факторинг — это финансовый инструмент, позволяющий поставщику товаров или услуг получить деньги немедленно, не дожидаясь оплаты от покупателя (дебитора). Swiss Factoring выкупает вашу дебиторскую задолженность и перечисляет аванс в размере 85–90% от суммы документа.
          </p>
          <p style="font-size:14px;color:#475569;line-height:1.8">
            Это не кредит. Вы не берёте долг — вы просто получаете деньги, которые вам уже должны, быстрее.
          </p>
        </div>

        <div class="cl-card" style="padding:28px">
          <h2 style="font-size:18px;font-weight:800;color:#0f172a;margin-bottom:18px">📋 Схема работы</h2>
          <div style="display:flex;flex-direction:column;gap:14px">
            <div v-for="(step, i) in [
              {icon:'📦', title:'Поставка товара или услуги', desc:'Вы поставляете товар/услугу дебитору и получаете АВР (акт выполненных работ) или накладную.'},
              {icon:'📄', title:'Уступка права требования', desc:'Вы уступаете право требования по АВР компании Swiss Factoring. При факторинге с уведомлением дебитор получает уведомление об уступке.'},
              {icon:'💰', title:'Получение аванса', desc:'Swiss Factoring переводит вам аванс (85–90% от суммы документа) в течение 1 рабочего дня после верификации.'},
              {icon:'🏢', title:'Дебитор погашает долг', desc:'В дату планового гашения дебитор перечисляет сумму напрямую Swiss Factoring по реквизитам из уведомления об уступке.'},
              {icon:'✅', title:'Получение ВОП', desc:'После полного погашения дебитором Swiss Factoring перечисляет вам остаток: ВОП = сумма АВР − финансирование − K1 − K2.'},
            ]" :key="i" style="display:flex;gap:16px;align-items:flex-start">
              <div style="width:44px;height:44px;border-radius:12px;background:#eff6ff;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">{{step.icon}}</div>
              <div><div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:4px">{{i+1}}. {{step.title}}</div><div style="font-size:13px;color:#64748b;line-height:1.7">{{step.desc}}</div></div>
            </div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px" class="grid-2">
          <div class="cl-card" style="padding:24px">
            <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:14px">💸 Комиссия K1</h3>
            <p style="font-size:13px;color:#475569;line-height:1.7;margin-bottom:10px">Вознаграждение за пользование деньгами. Начисляется ежедневно начиная со следующего дня после выдачи финансирования.</p>
            <div style="background:#f8fbff;border-radius:10px;padding:14px;font-size:13px">
              <div style="font-weight:700;color:#1d4ed8;margin-bottom:4px">Формула K1:</div>
              <div style="color:#475569;">K1 = ОД × ставка% / 365 × дни</div>
              <div style="color:#94a3b8;margin-top:4px;font-size:12px">+ НДС 16% сверху</div>
            </div>
          </div>
          <div class="cl-card" style="padding:24px">
            <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:14px">📊 Комиссия K2</h3>
            <p style="font-size:13px;color:#475569;line-height:1.7;margin-bottom:10px">Комиссия за уступку права требования. Начисляется кумулятивно от суммы документа, зависит от количества дней.</p>
            <div style="background:#f8fbff;border-radius:10px;padding:14px;font-size:13px">
              <div style="font-weight:700;color:#7c3aed;margin-bottom:4px">Диапазоны K2:</div>
              <div style="color:#475569;">0–30 дней → минимальная ставка</div>
              <div style="color:#475569;">31–60 → выше; 61–90 → ещё выше</div>
              <div style="color:#94a3b8;margin-top:4px;font-size:12px">База = сумма документа</div>
            </div>
          </div>
          <div class="cl-card" style="padding:24px">
            <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:14px">🔄 ЧДГ (досрочное гашение)</h3>
            <p style="font-size:13px;color:#475569;line-height:1.7">Вы или дебитор можете погашать долг частями (ЧДГ — частично досрочное гашение). Очерёдность: сначала K1, затем K2, потом основной долг.</p>
          </div>
          <div class="cl-card" style="padding:24px">
            <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:14px">💎 ВОП (возвратный остаток)</h3>
            <p style="font-size:13px;color:#475569;line-height:1.7;margin-bottom:10px">После полного погашения Swiss Factoring возвращает вам остаток.</p>
            <div style="background:#f0fdf4;border-radius:10px;padding:12px;font-size:13px;color:#15803d;font-weight:600">
              ВОП = АВР − Финансирование − K1 − K2
            </div>
          </div>
        </div>

        <div class="cl-card" style="padding:24px">
          <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:14px">❓ Часто задаваемые вопросы</h3>
          <div style="display:flex;flex-direction:column;gap:16px">
            <div v-for="faq in [
              {q:'Нужно ли уведомлять покупателя?', a:'При классическом факторинге с уведомлением — да. Дебитор подписывает уведомление об уступке и платит напрямую Swiss Factoring. При факторинге без уведомления (тип F1) уведомление не требуется.'},
              {q:'Что если покупатель не заплатит вовремя?', a:'Финансирование переходит в статус «Просрочка» (overdue). Начисление K1 продолжается. Через 60 дней — статус «Дефолт». Swiss Factoring активирует процедуру взыскания и уведомит вас.'},
              {q:'Можно ли погасить долг досрочно?', a:'Да, в любой момент. При ЧДГ (частично досрочном гашении) сначала погашаются начисленные K1 и K2, затем уменьшается основной долг. K2 при этом пересчитывается по фактическому сроку.'},
              {q:'Что такое дисконт?', a:'Дисконт — это коэффициент финансирования. Если дисконт 85%, вы получаете 85% от суммы документа авансом. Оставшиеся 15% (минус комиссии) вы получите в виде ВОП после закрытия сделки.'},
            ]" :key="faq.q" style="border-bottom:1px solid #f1f5f9;padding-bottom:16px">
              <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:6px">{{faq.q}}</div>
              <div style="font-size:13px;color:#64748b;line-height:1.7">{{faq.a}}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};

/* ============================================================
   LANDING SECTIONS DATA
============================================================ */
const TARIFFS = [
  {
    name: 'Классик.F2', forWhom: 'Для устойчивого бизнеса', featured: false,
    k1: '6.0', k2rows: [['0–30 дн.','1.30%'],['31–60 дн.','2.60%'],['61–90 дн.','3.90%'],['91–120 дн.','5.20%'],['120+ дн.','6.60%']],
    discount: '85%',
  },
  {
    name: 'Премиум.F2', forWhom: 'Для быстрорастущих компаний', featured: true,
    k1: '6.6', k2rows: [['0–30 дн.','1.52%'],['31–60 дн.','3.04%'],['61–90 дн.','4.56%'],['91–120 дн.','6.08%'],['120+ дн.','9.70%']],
    discount: '90%',
  },
  {
    name: 'VIP.F2', forWhom: 'Для крупных клиентов', featured: false,
    k1: '5.0', k2rows: [['0–30 дн.','0.49%'],['31–60 дн.','0.99%'],['61–90 дн.','1.75%'],['91–120 дн.','2.99%'],['120+ дн.','5.99%']],
    discount: '90%',
  },
  {
    name: 'Corp.F2', forWhom: 'Для корпоративных клиентов', featured: false,
    k1: '5.5', k2rows: [['0–30 дн.','0.65%'],['31–60 дн.','1.30%'],['61–90 дн.','1.95%'],['91–120 дн.','2.60%'],['120+ дн.','3.25%']],
    discount: '88%',
  },
];

const FEATURES = [
  { icon: '⚡', color: '#fef3c7', title: 'Деньги за 24 часа', desc: 'После верификации документов аванс зачисляется на ваш счёт в течение одного рабочего дня.' },
  { icon: '🏦', color: '#dcfce7', title: 'Без залога', desc: 'Обеспечением служит сама дебиторская задолженность. Никаких залогов недвижимости или оборудования.' },
  { icon: '📈', color: '#dbeafe', title: 'До 90% аванс', desc: 'Получайте от 85% до 90% суммы документа немедленно. Остаток — после погашения дебитором.' },
  { icon: '🔒', color: '#ede9fe', title: 'Конфиденциально', desc: 'Факторинг без уведомления: ваш покупатель не знает о привлечении финансирования.' },
  { icon: '👥', color: '#fce7f3', title: 'Персональный менеджер', desc: 'Выделенный менеджер сопровождает каждую сделку от подачи заявки до закрытия.' },
  { icon: '📊', color: '#ccfbf1', title: 'Онлайн-кабинет', desc: 'Личный кабинет с доступом 24/7: все финансирования, комиссии, история операций в реальном времени.' },
];

const STEPS = [
  { icon: '📦', title: 'Поставьте товар или услугу', desc: 'Заключите договор с покупателем (дебитором), поставьте товар или окажите услугу, получите подписанный АВР или накладную.', badge: 'Начало сделки' },
  { icon: '📋', title: 'Подайте заявку', desc: 'Заполните заявку в личном кабинете: укажите дебитора, номер АВР, сумму и срок отсрочки. Прикрепите скан документа.', badge: '5 минут' },
  { icon: '🔍', title: 'Верификация дебитора', desc: 'Наш риск-отдел проверяет дебитора и подтверждает сделку. Для аккредитованных дебиторов — автоматически.', badge: '1–2 дня' },
  { icon: '💳', title: 'Получите аванс', desc: 'Swiss Factoring переводит вам 85–90% от суммы документа. Деньги поступают на счёт в день выдачи финансирования.', badge: 'В тот же день' },
  { icon: '🏢', title: 'Дебитор платит Swiss Factoring', desc: 'В срок по уведомлению дебитор перечисляет полную сумму напрямую на счёт Swiss Factoring. Вас это не касается.', badge: 'Автоматически' },
  { icon: '✅', title: 'Получите ВОП', desc: 'После полного погашения Swiss Factoring рассчитывает ВОП (возвратный остаточный платёж) и переводит вам остаток.', badge: 'Закрытие сделки' },
];

const FAQ_ITEMS = [
  { q: 'Какие документы нужны для старта?', a: 'Для заключения генерального договора: свидетельство о регистрации, устав, решение об ЭП, финансовая отчётность за последний год. Для каждой сделки: АВР или накладная, счёт-фактура (ЭСФ), договор поставки с дебитором.' },
  { q: 'Сколько стоит факторинг?', a: 'Стоимость складывается из двух комиссий: K1 — вознаграждение за пользование деньгами (5–13% годовых от ОД), начисляется ежедневно. K2 — комиссия за уступку (0.49–10% от суммы документа), зависит от срока. Все ставки фиксированы в вашем тарифном плане.' },
  { q: 'Как быстро я получу деньги?', a: 'После подачи заявки и верификации документов (1–2 рабочих дня для новых дебиторов, мгновенно для аккредитованных) аванс поступает на счёт в день выдачи финансирования. Итого от подачи до получения денег: 1–3 рабочих дня.' },
  { q: 'Нужно ли уведомлять покупателя?', a: 'Зависит от тарифного плана. При классическом факторинге (F2, F4, F5) дебитор подписывает уведомление об уступке и платит напрямую Swiss Factoring. При факторинге без уведомления (F1) покупатель не знает о факторинге — он платит вам, вы погашаете долг перед Swiss Factoring.' },
  { q: 'Что если покупатель не заплатит вовремя?', a: 'Финансирование переходит в статус «Просрочка». Начисление K1 продолжается — стоимость факторинга растёт. Через 60 дней просрочки статус меняется на «Дефолт». Swiss Factoring уведомляет вас и начинает процедуру взыскания. В зависимости от договора возможен регресс к вам.' },
  { q: 'Можно ли погасить долг досрочно?', a: 'Да, в любой момент. При ЧДГ (частично досрочном гашении) очерёдность строгая: сначала погашается начисленный K1, затем K2, после — основной долг. Досрочное погашение выгодно — K2 рассчитывается по фактическому сроку, не по плановому.' },
  { q: 'Что такое ВОП?', a: 'ВОП — Возвратный Остаточный Платёж. После того как дебитор полностью погасил долг, Swiss Factoring рассчитывает: ВОП = Сумма АВР − Финансирование − K1 (итого) − K2 (итого). Если ВОП положительный, мы переводим его вам. Это «хвост» от сделки — ваши деньги.' },
  { q: 'Какой минимальный размер сделки?', a: 'Минимальная сумма документа — ₸1 000 000 (один миллион тенге). Максимальный лимит определяется генеральным договором и кредитным лимитом по дебитору. Текущий максимальный лимит по нашим клиентам — ₸500 млн на одного дебитора.' },
];

const CLIENTS = [
  { name: 'ТОО «Гранат»', icon: '🏗️', industry: 'Строительство' },
  { name: 'ТОО «Aurora»', icon: '⚡', industry: 'Энергетика' },
  { name: 'ТОО «КомпИнвестСтр»', icon: '🏢', industry: 'Строительство' },
  { name: 'ТОО «PolAtyrau»', icon: '🛢️', industry: 'Нефтегаз' },
  { name: 'ТОО «МонтСтройСп»', icon: '🔧', industry: 'Монтаж' },
  { name: 'ТОО «KeyPartGr»', icon: '🔑', industry: 'Партнёрства' },
  { name: 'ТОО «КазМет»', icon: '⚙️', industry: 'Металлургия' },
  { name: 'ТОО «НурСтрой»', icon: '🏗️', industry: 'Строительство' },
  { name: 'АО «СтройИнвест»', icon: '📈', industry: 'Инвестиции' },
  { name: 'ТОО «МегаТрейд»', icon: '🏪', industry: 'Торговля' },
  { name: 'ТОО «ЭнергоСистемы»', icon: '🔋', industry: 'Энергетика' },
  { name: 'ТОО «Контроль-Сервис»', icon: '📋', industry: 'Услуги' },
];

/* ============================================================
   MAIN APP
============================================================ */
const App = {
  setup() {
    const authed = ref(!!localStorage.getItem('site_token'));
    const showModal = ref(false);
    const sidebarOpen = ref(false);
    const page = ref('dashboard');
    const detailId = ref(null);
    const user = ref(null);
    const clientProfile = ref(null);

    // Login
    const loginEmail = ref('granit@swiss.kz');
    const loginPassword = ref('password');
    const loginError = ref('');
    const loginLoading = ref(false);

    // FAQ
    const openFaq = ref(null);

    // Contact form
    const contactForm = ref({ company: '', bin: '', name: '', phone: '', email: '', comment: '' });
    const contactSent = ref(false);

    const login = async () => {
      loginError.value = '';
      loginLoading.value = true;
      try {
        const r = await api.login(loginEmail.value, loginPassword.value);
        if (r.user.role !== 'client' && r.user.role !== 'admin') {
          loginError.value = 'Этот портал только для клиентов';
          return;
        }
        localStorage.setItem('site_token', r.token);
        authed.value = true;
        user.value = r.user;
        showModal.value = false;
        try { clientProfile.value = await api.profile(); } catch {}
      } catch (e) {
        loginError.value = e.message || 'Неверный логин или пароль';
      } finally {
        loginLoading.value = false;
      }
    };

    const logout = () => {
      localStorage.removeItem('site_token');
      authed.value = false;
      user.value = null;
      clientProfile.value = null;
      page.value = 'dashboard';
    };

    const navigate = (id) => {
      page.value = id;
      detailId.value = null;
      sidebarOpen.value = false;
    };

    const openDetail = (id) => {
      detailId.value = id;
      page.value = 'detail';
      sidebarOpen.value = false;
    };

    const backToList = () => {
      detailId.value = null;
      page.value = 'financings';
    };

    const openLogin = () => { showModal.value = true; };
    const closeModal = () => { showModal.value = false; loginError.value = ''; };

    const toggleFaq = (i) => { openFaq.value = openFaq.value === i ? null : i; };

    const submitContact = () => { contactSent.value = true; };

    const scrollTo = (id) => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    onMounted(async () => {
      if (authed.value) {
        try {
          user.value = await api.me();
          clientProfile.value = await api.profile();
        } catch { logout(); }
      }
    });

    const clientName = computed(() => clientProfile.value?.client?.name || user.value?.name || 'Клиент');
    const clientInitial = computed(() => {
      const n = clientProfile.value?.client?.name || user.value?.name || 'К';
      return n[0].toUpperCase();
    });

    const NAV_CAB = [
      { id: 'dashboard',  label: 'Главная',            icon: '🏠' },
      { id: 'financings', label: 'Мои финансирования', icon: '📋' },
      { id: 'request',    label: 'Новая заявка',        icon: '➕' },
      { id: 'info',       label: 'О факторинге',        icon: '❓' },
    ];

    return {
      authed, showModal, sidebarOpen, page, detailId, user, clientProfile, clientName, clientInitial,
      loginEmail, loginPassword, loginError, loginLoading,
      openFaq, contactForm, contactSent,
      login, logout, navigate, openDetail, backToList, openLogin, closeModal, toggleFaq, submitContact, scrollTo,
      NAV_CAB, DEMO_ACCOUNTS, TARIFFS, FEATURES, STEPS, FAQ_ITEMS, CLIENTS,
      CabDashboard, CabFinancings, CabFinancingDetail, CabNewRequest, CabInfo,
    };
  },

  template: `
    <!-- LOGIN MODAL -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-box">
        <div class="modal-header">
          <div class="modal-logo">
            <div class="modal-logo-icon">SF</div>
            <div>
              <div style="font-size:16px;font-weight:800;color:#0f172a">Swiss Factoring</div>
              <div style="font-size:12px;color:#64748b">Личный кабинет</div>
            </div>
            <button class="modal-close" @click="closeModal" style="margin-left:auto">✕</button>
          </div>
          <div class="modal-title">Вход в кабинет</div>
          <div class="modal-subtitle">Введите ваши данные для входа</div>
        </div>
        <div class="modal-body">
          <div class="modal-field">
            <label class="modal-label">Аккаунт</label>
            <select v-model="loginEmail" class="modal-select">
              <option v-for="a in DEMO_ACCOUNTS" :key="a.email" :value="a.email">{{a.name}} ({{a.email}})</option>
            </select>
            <input v-model="loginEmail" type="email" class="modal-input" placeholder="или введите email вручную" @keyup.enter="login"/>
          </div>
          <div class="modal-field">
            <label class="modal-label">Пароль</label>
            <input v-model="loginPassword" type="password" class="modal-input" placeholder="••••••••" @keyup.enter="login"/>
          </div>
          <div v-if="loginError" class="modal-error">{{loginError}}</div>
          <button @click="login" :disabled="loginLoading" class="modal-btn">
            {{loginLoading ? 'Входим...' : 'Войти в личный кабинет'}}
          </button>
          <div class="modal-hint">
            <strong style="color:#374151">Для тестирования</strong> — используйте пароль <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px">password</code> для любого аккаунта.<br>
            Для получения доступа к боевому кабинету обратитесь к вашему менеджеру.
          </div>
        </div>
      </div>
    </div>

    <!-- CABINET (authenticated) -->
    <div v-if="authed" class="cab-wrap">
      <div class="cab-overlay" :class="{open: sidebarOpen}" @click="sidebarOpen=false"></div>
      <nav class="cab-sidebar" :class="{'is-open': sidebarOpen}">
        <div class="cab-logo-bar">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:38px;height:38px;background:linear-gradient(135deg,#1d4ed8,#3b82f6);border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:900;color:#fff;font-size:15px;flex-shrink:0">SF</div>
            <div>
              <div style="color:#0f172a;font-weight:800;font-size:15px">Swiss Factoring</div>
              <div style="color:#94a3b8;font-size:11px">Личный кабинет</div>
            </div>
          </div>
        </div>
        <div class="cab-user-bar">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="cab-avatar">{{clientInitial}}</div>
            <div style="min-width:0">
              <div style="font-size:13px;font-weight:700;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{clientName}}</div>
              <div style="font-size:11px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{user?.email || ''}}</div>
            </div>
          </div>
        </div>
        <div style="flex:1;padding:12px 0">
          <div class="cab-nav-section">Меню</div>
          <button v-for="n in NAV_CAB" :key="n.id"
            :class="['cab-nav-link', page===n.id ? 'active' : '']"
            @click="navigate(n.id)">
            <span class="cab-nav-icon">{{n.icon}}</span>
            {{n.label}}
            <span v-if="n.id==='request'" style="margin-left:auto;background:#2563eb;color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px">NEW</span>
          </button>
        </div>
        <div style="padding:16px 20px;border-top:1px solid #f1f5f9">
          <div v-if="clientProfile?.agreement" style="padding:12px;background:#f0f6ff;border-radius:10px;margin-bottom:12px">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8">Договор</div>
            <div style="font-size:13px;font-weight:700;color:#2563eb;margin-top:2px">{{clientProfile.agreement.number}}</div>
            <div style="font-size:11px;color:#64748b;margin-top:1px">{{clientProfile.agreement.tariff_name}}</div>
          </div>
          <button @click="logout" style="width:100%;padding:9px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;color:#64748b;font-size:13px;font-weight:600;cursor:pointer">
            Выйти
          </button>
        </div>
      </nav>
      <div class="cab-spacer"></div>
      <div class="cab-main">
        <div class="cab-topbar">
          <button style="background:none;border:none;cursor:pointer;font-size:22px;color:#374151" @click="sidebarOpen=true">☰</button>
          <span style="color:#0f172a;font-weight:700;font-size:15px">Swiss Factoring</span>
        </div>
        <main class="cab-content">
          <component v-if="page==='dashboard'" :is="CabDashboard" />
          <component v-else-if="page==='financings'" :is="CabFinancings" @detail="openDetail" />
          <component v-else-if="page==='detail' && detailId" :is="CabFinancingDetail" :fin-id="detailId" @back="backToList" />
          <component v-else-if="page==='request'" :is="CabNewRequest" />
          <component v-else-if="page==='info'" :is="CabInfo" />
        </main>
      </div>
    </div>

    <!-- LANDING (public) -->
    <div v-else>
      <!-- NAVBAR -->
      <nav class="site-nav">
        <div class="nav-inner">
          <a href="#hero" class="nav-logo" @click.prevent="scrollTo('hero')">
            <div class="nav-logo-icon">SF</div>
            <div>
              <div class="nav-logo-text">Swiss Factoring</div>
              <div class="nav-logo-sub">Алматы, Казахстан</div>
            </div>
          </a>
          <div class="nav-links">
            <a class="nav-link" href="#about" @click.prevent="scrollTo('about')">О факторинге</a>
            <a class="nav-link" href="#how" @click.prevent="scrollTo('how')">Как работает</a>
            <a class="nav-link" href="#tariffs" @click.prevent="scrollTo('tariffs')">Тарифы</a>
            <a class="nav-link" href="#clients" @click.prevent="scrollTo('clients')">Клиенты</a>
            <a class="nav-link" href="#faq" @click.prevent="scrollTo('faq')">FAQ</a>
            <a class="nav-link" href="#contact" @click.prevent="scrollTo('contact')">Контакты</a>
          </div>
          <div class="nav-actions">
            <button class="btn-nav-cabinet" @click="openLogin">Личный кабинет →</button>
          </div>
        </div>
      </nav>

      <!-- HERO -->
      <section class="hero" id="hero">
        <div class="hero-inner">
          <div class="hero-badge">
            <span class="hero-badge-dot"></span>
            Работаем в Казахстане с 2024 года
          </div>
          <h1 class="hero-title">
            Получите финансирование<br>
            до <span class="text-gradient">₸500 млн</span> за 24 часа
          </h1>
          <p class="hero-subtitle">
            Swiss Factoring — надёжный партнёр для роста вашего бизнеса в Казахстане.
            Уступите дебиторскую задолженность и получите деньги немедленно — без залога и кредитной нагрузки.
          </p>
          <div class="hero-actions">
            <button class="btn-hero-primary" @click="openLogin">Подать заявку бесплатно</button>
            <button class="btn-hero-secondary" @click="scrollTo('about')">Узнать подробнее ↓</button>
          </div>
          <div class="hero-stats">
            <div class="hero-stat">
              <div class="hero-stat-val">₸4.87<span style="font-size:20px;font-weight:600"> млрд</span></div>
              <div class="hero-stat-label">выдано финансирований</div>
            </div>
            <div class="hero-stat">
              <div class="hero-stat-val">32</div>
              <div class="hero-stat-label">клиента-поставщика</div>
            </div>
            <div class="hero-stat">
              <div class="hero-stat-val">156</div>
              <div class="hero-stat-label">сделок завершено</div>
            </div>
            <div class="hero-stat">
              <div class="hero-stat-val">24 ч</div>
              <div class="hero-stat-label">среднее время выдачи</div>
            </div>
          </div>
        </div>
        <div class="hero-scroll-hint">
          <span>Прокрутите вниз</span>
          <span>↓</span>
        </div>
      </section>

      <!-- ABOUT FACTORING -->
      <section id="about">
        <div class="section-inner">
          <div class="about-grid">
            <div class="about-text">
              <div class="section-tag">📖 О факторинге</div>
              <h2>Что такое факторинг и зачем он нужен?</h2>
              <p>
                Факторинг — это финансовый инструмент, при котором поставщик товаров или услуг уступает свою дебиторскую задолженность факторинговой компании и получает деньги немедленно, не дожидаясь оплаты от покупателя.
              </p>
              <p>
                Это не кредит. Вы не берёте долг — вы просто получаете деньги, которые вам уже должны, быстрее. Обеспечение — сама дебиторка. Никаких залогов, никакой кредитной нагрузки на баланс.
              </p>
              <div class="about-list">
                <div class="about-list-item" v-for="item in [
                  {icon:'✅', text:'Финансирование без залога имущества'},
                  {icon:'✅', text:'Не влияет на кредитный рейтинг компании'},
                  {icon:'✅', text:'Аванс 85–90% от суммы документа'},
                  {icon:'✅', text:'Подходит для любого размера бизнеса'},
                  {icon:'✅', text:'Онлайн-кабинет и персональный менеджер'},
                ]" :key="item.text">
                  <div class="about-list-icon">{{item.icon}}</div>
                  <span>{{item.text}}</span>
                </div>
              </div>
            </div>
            <div class="diagram">
              <div class="diagram-title">Схема факторинговой сделки</div>
              <div class="diagram-flow">
                <div class="diagram-step">
                  <div class="diagram-step-icon" style="background:#eff6ff">🏭</div>
                  <div class="diagram-step-info">
                    <div class="label">Поставщик (Вы)</div>
                    <div class="sublabel">Поставляете товар или услугу</div>
                  </div>
                </div>
                <div class="diagram-arrow">
                  <span>↓</span>
                  <span class="diagram-arrow-badge">АВР / Накладная</span>
                </div>
                <div class="diagram-step">
                  <div class="diagram-step-icon" style="background:#dbeafe">🏦</div>
                  <div class="diagram-step-info">
                    <div class="label">Swiss Factoring</div>
                    <div class="sublabel">Выкупает право требования</div>
                  </div>
                </div>
                <div class="diagram-arrow">
                  <span>↙</span>
                  <span class="diagram-arrow-badge">Аванс 85–90%</span>
                  <span>↘</span>
                  <span class="diagram-arrow-badge">Уведомление</span>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                  <div class="diagram-step">
                    <div class="diagram-step-icon" style="background:#dcfce7">💰</div>
                    <div class="diagram-step-info">
                      <div class="label">Вы</div>
                      <div class="sublabel">Получаете деньги сразу</div>
                    </div>
                  </div>
                  <div class="diagram-step">
                    <div class="diagram-step-icon" style="background:#fef3c7">🏢</div>
                    <div class="diagram-step-info">
                      <div class="label">Дебитор</div>
                      <div class="sublabel">Платит в срок факторингу</div>
                    </div>
                  </div>
                </div>
                <div class="diagram-arrow">↓ <span class="diagram-arrow-badge">ВОП — остаток после закрытия</span></div>
                <div class="diagram-step" style="border-color:#bbf7d0;background:#f0fdf4">
                  <div class="diagram-step-icon" style="background:#dcfce7">✅</div>
                  <div class="diagram-step-info">
                    <div class="label" style="color:#15803d">Вы получаете ВОП</div>
                    <div class="sublabel">АВР − Финансирование − K1 − K2</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FEATURES -->
      <section class="features-bg" id="features">
        <div class="section-inner">
          <div class="section-header" style="text-align:center">
            <div class="section-tag">⭐ Преимущества</div>
            <h2 class="section-title">Почему выбирают Swiss Factoring?</h2>
            <p class="section-subtitle" style="margin:0 auto">Мы предлагаем прозрачные условия, быстрые выплаты и профессиональное сопровождение каждой сделки.</p>
          </div>
          <div class="features-grid">
            <div class="feature-card" v-for="f in FEATURES" :key="f.title">
              <div class="feature-icon" :style="{background: f.color}">{{f.icon}}</div>
              <div class="feature-title">{{f.title}}</div>
              <div class="feature-desc">{{f.desc}}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- HOW IT WORKS -->
      <section id="how">
        <div class="section-inner">
          <div class="section-header" style="text-align:center">
            <div class="section-tag">🚀 Как работает</div>
            <h2 class="section-title">6 шагов к финансированию</h2>
            <p class="section-subtitle" style="margin:0 auto">От подачи заявки до получения денег — всего несколько рабочих дней. Всё прозрачно и автоматизировано.</p>
          </div>
          <div class="steps-grid">
            <div class="step-card" v-for="(s, i) in STEPS" :key="i">
              <div class="step-number">{{(i+1).toString().padStart(2,'0')}}</div>
              <div class="step-icon">{{s.icon}}</div>
              <div class="step-title">{{s.title}}</div>
              <div class="step-desc">{{s.desc}}</div>
              <span class="step-badge">{{s.badge}}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- TARIFFS -->
      <section class="tariffs-bg" id="tariffs">
        <div class="section-inner">
          <div class="section-header" style="text-align:center">
            <div class="section-tag">💼 Тарифы</div>
            <h2 class="section-title">Тарифные планы</h2>
            <p class="section-subtitle" style="margin:0 auto">Выберите подходящий тариф или получите персональное предложение от менеджера.</p>
          </div>
          <div class="tariffs-grid">
            <div v-for="t in TARIFFS" :key="t.name" class="tariff-card" :class="{featured: t.featured}">
              <div v-if="t.featured" class="tariff-badge-popular">Популярный</div>
              <div class="tariff-header">
                <div class="tariff-name">{{t.name}}</div>
                <div class="tariff-for">{{t.forWhom}}</div>
              </div>
              <div class="tariff-k1">
                <div class="tariff-k1-label">K1 — ставка вознаграждения</div>
                <div>
                  <span class="tariff-k1-val">{{t.k1}}%</span>
                  <span class="tariff-k1-unit"> годовых</span>
                </div>
              </div>
              <div class="tariff-k2-table">
                <div class="tariff-k2-title">K2 — комиссия за уступку</div>
                <div v-for="row in t.k2rows" :key="row[0]" class="tariff-k2-row">
                  <span class="tariff-k2-days">{{row[0]}}</span>
                  <span class="tariff-k2-rate">{{row[1]}}</span>
                </div>
              </div>
              <div class="tariff-footer">
                <div style="font-size:12px;color:#64748b">Дисконт финансирования: <strong style="color:#0f172a">{{t.discount}}</strong></div>
              </div>
            </div>
          </div>
          <div style="text-align:center;margin-top:40px">
            <p style="font-size:15px;color:#64748b;margin-bottom:20px">Не уверены, какой тариф подходит? Получите персональное предложение.</p>
            <button class="btn-hero-primary" style="display:inline-block;font-size:15px" @click="scrollTo('contact')">
              Получить персональное предложение →
            </button>
          </div>
        </div>
      </section>

      <!-- NUMBERS -->
      <section class="numbers-section">
        <div class="section-inner" style="position:relative;z-index:1">
          <div style="text-align:center;margin-bottom:48px">
            <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:999px;padding:5px 14px;font-size:12px;font-weight:700;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:.06em;margin-bottom:16px">
              📊 Цифры
            </div>
            <h2 style="font-size:clamp(28px,3.5vw,44px);font-weight:900;color:#fff;margin-bottom:12px">Swiss Factoring в цифрах</h2>
            <p style="font-size:16px;color:rgba(255,255,255,0.6)">Реальные данные за 15 месяцев работы</p>
          </div>
          <div class="numbers-grid">
            <div class="numbers-item">
              <div class="numbers-val">₸4.87</div>
              <div style="font-size:16px;font-weight:600;color:rgba(255,255,255,0.5);margin-bottom:6px">млрд</div>
              <div class="numbers-label">общий портфель</div>
              <div class="numbers-sub">за 15 месяцев работы</div>
            </div>
            <div class="numbers-item">
              <div class="numbers-val">32</div>
              <div class="numbers-label">клиента-поставщика</div>
              <div class="numbers-sub">активных и завершённых</div>
            </div>
            <div class="numbers-item">
              <div class="numbers-val">57</div>
              <div class="numbers-label">дебиторов в базе</div>
              <div class="numbers-sub">верифицированных покупателей</div>
            </div>
            <div class="numbers-item">
              <div class="numbers-val">156</div>
              <div class="numbers-label">финансирований выдано</div>
              <div class="numbers-sub">средний размер ₸31 млн</div>
            </div>
          </div>
        </div>
      </section>

      <!-- CLIENTS -->
      <section class="clients-bg" id="clients">
        <div class="section-inner">
          <div class="section-header" style="text-align:center">
            <div class="section-tag">🤝 Клиенты</div>
            <h2 class="section-title">Нам доверяют</h2>
            <p class="section-subtitle" style="margin:0 auto">Более 32 компаний из разных отраслей экономики Казахстана работают с Swiss Factoring.</p>
          </div>
          <div class="clients-grid">
            <div class="client-chip" v-for="c in CLIENTS" :key="c.name">
              <div class="client-chip-icon">{{c.icon}}</div>
              <div>{{c.name}}</div>
              <div class="client-chip-industry">{{c.industry}}</div>
            </div>
          </div>
          <div style="text-align:center;margin-top:40px;padding:32px;background:#f8fafc;border-radius:16px;border:1px solid #e2e8f0">
            <div style="font-size:24px;font-weight:800;color:#0f172a;margin-bottom:8px">И ещё 20+ компаний</div>
            <div style="font-size:15px;color:#64748b;margin-bottom:20px">из строительства, торговли, нефтегазовой и металлургической отраслей</div>
            <button class="btn-nav-cabinet" @click="openLogin">Стать клиентом →</button>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section class="faq-bg" id="faq">
        <div class="section-inner">
          <div class="section-header" style="text-align:center">
            <div class="section-tag">❓ FAQ</div>
            <h2 class="section-title">Частые вопросы</h2>
            <p class="section-subtitle" style="margin:0 auto">Ответы на самые популярные вопросы о факторинге и работе с Swiss Factoring.</p>
          </div>
          <div class="faq-grid">
            <div v-for="(item, i) in FAQ_ITEMS" :key="i" class="faq-item" :class="{open: openFaq===i}">
              <button class="faq-question" @click="toggleFaq(i)">
                <span>{{item.q}}</span>
                <span class="faq-chevron">▼</span>
              </button>
              <div class="faq-answer">{{item.a}}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- CONTACT -->
      <section class="contact-section" id="contact">
        <div class="section-inner">
          <div class="contact-grid">
            <div>
              <div class="contact-info-card">
                <div class="contact-info-title">Свяжитесь с нами</div>
                <div class="contact-info-desc">Наши менеджеры проконсультируют по всем вопросам факторинга и подберут оптимальный тариф для вашего бизнеса.</div>
                <div class="contact-detail">
                  <div class="contact-detail-icon">📞</div>
                  <div>
                    <div class="contact-detail-label">Телефон</div>
                    <div class="contact-detail-val">+7 (701) 000-00-00</div>
                  </div>
                </div>
                <div class="contact-detail">
                  <div class="contact-detail-icon">✉️</div>
                  <div>
                    <div class="contact-detail-label">Email</div>
                    <div class="contact-detail-val">support@swiss.kz</div>
                  </div>
                </div>
                <div class="contact-detail">
                  <div class="contact-detail-icon">📍</div>
                  <div>
                    <div class="contact-detail-label">Адрес</div>
                    <div class="contact-detail-val">г. Алматы, ул. Панфилова 75</div>
                  </div>
                </div>
                <div class="contact-detail">
                  <div class="contact-detail-icon">⏰</div>
                  <div>
                    <div class="contact-detail-label">Режим работы</div>
                    <div class="contact-detail-val">Пн–Пт 09:00–18:00</div>
                  </div>
                </div>
                <div style="margin-top:24px;padding:16px;background:rgba(255,255,255,0.1);border-radius:12px">
                  <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-bottom:8px;font-weight:600">Уже наш клиент?</div>
                  <button @click="openLogin" style="width:100%;padding:11px;background:#fff;color:#1d4ed8;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;transition:opacity .15s" onmouseover="this.style.opacity='.9'" onmouseout="this.style.opacity='1'">
                    Войти в личный кабинет →
                  </button>
                </div>
              </div>
            </div>
            <div class="contact-form-card">
              <div v-if="contactSent" class="form-success">
                <div class="form-success-icon">✅</div>
                <div class="form-success-title">Заявка отправлена!</div>
                <div class="form-success-text">Наш менеджер свяжется с вами в течение 2 рабочих часов для уточнения деталей и подбора оптимального тарифного плана.</div>
              </div>
              <template v-else>
                <h3 style="font-size:22px;font-weight:800;color:#0f172a;margin-bottom:6px">Оставить заявку</h3>
                <p style="font-size:14px;color:#64748b;margin-bottom:28px">Заполните форму — мы перезвоним и подберём условия</p>
                <div class="form-grid-2">
                  <div class="form-group">
                    <label class="form-label">Название компании *</label>
                    <input v-model="contactForm.company" class="form-input" placeholder="ТОО «Ваша компания»"/>
                  </div>
                  <div class="form-group">
                    <label class="form-label">БИН</label>
                    <input v-model="contactForm.bin" class="form-input" placeholder="123456789012"/>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Контактное лицо *</label>
                  <input v-model="contactForm.name" class="form-input" placeholder="ФИО руководителя или бухгалтера"/>
                </div>
                <div class="form-grid-2">
                  <div class="form-group">
                    <label class="form-label">Телефон *</label>
                    <input v-model="contactForm.phone" class="form-input" placeholder="+7 (777) 000-00-00"/>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Email</label>
                    <input v-model="contactForm.email" class="form-input" placeholder="info@company.kz"/>
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Комментарий</label>
                  <textarea v-model="contactForm.comment" class="form-input form-textarea" placeholder="Расскажите о ваших потребностях: объём финансирования, дебиторы, сроки..."></textarea>
                </div>
                <button @click="submitContact" class="btn-submit">
                  Отправить заявку →
                </button>
                <p style="font-size:12px;color:#94a3b8;text-align:center;margin-top:14px">
                  Нажимая кнопку, вы соглашаетесь на обработку персональных данных
                </p>
              </template>
            </div>
          </div>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="site-footer">
        <div class="footer-inner">
          <div class="footer-grid">
            <div>
              <div class="footer-brand-logo">
                <div class="footer-logo-icon">SF</div>
                <div class="footer-brand-text">Swiss Factoring</div>
              </div>
              <div class="footer-desc">
                Специализированная факторинговая компания в Казахстане. Помогаем бизнесу получить финансирование быстро, выгодно и без лишних формальностей.
              </div>
            </div>
            <div>
              <div class="footer-col-title">Компания</div>
              <div class="footer-links">
                <button class="footer-link" @click="scrollTo('about')">О факторинге</button>
                <button class="footer-link" @click="scrollTo('how')">Как это работает</button>
                <button class="footer-link" @click="scrollTo('tariffs')">Тарифные планы</button>
                <button class="footer-link" @click="scrollTo('clients')">Наши клиенты</button>
              </div>
            </div>
            <div>
              <div class="footer-col-title">Клиентам</div>
              <div class="footer-links">
                <button class="footer-link" @click="openLogin">Личный кабинет</button>
                <button class="footer-link" @click="scrollTo('faq')">FAQ</button>
                <button class="footer-link" @click="scrollTo('contact')">Подать заявку</button>
                <button class="footer-link" @click="scrollTo('contact')">Контакты</button>
              </div>
            </div>
            <div>
              <div class="footer-col-title">Контакты</div>
              <div class="footer-contact-item">
                <div class="footer-contact-icon">📞</div>
                <span>+7 (701) 000-00-00</span>
              </div>
              <div class="footer-contact-item">
                <div class="footer-contact-icon">✉️</div>
                <span>support@swiss.kz</span>
              </div>
              <div class="footer-contact-item">
                <div class="footer-contact-icon">📍</div>
                <span>г. Алматы, ул. Панфилова 75</span>
              </div>
              <div class="footer-contact-item">
                <div class="footer-contact-icon">⏰</div>
                <span>Пн–Пт, 09:00–18:00</span>
              </div>
            </div>
          </div>
          <hr class="footer-divider"/>
          <div class="footer-bottom">
            <span>© 2024–2026 Swiss Factoring. Все права защищены.</span>
            <span style="color:rgba(255,255,255,0.3)">Лицензия НБ РК · г. Алматы, Казахстан</span>
          </div>
        </div>
      </footer>
    </div>
  `
};

createApp(App).mount('#sf-site');
