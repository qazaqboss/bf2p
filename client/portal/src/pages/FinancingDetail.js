import { api } from '../api.js';
import { fmt, fmtDate, fmtPct } from '../utils.js';

export default {
  props: ['finId'],
  emits: ['back'],
  setup(props) {
    const { ref, onMounted } = Vue;
    const data = ref(null);
    const loading = ref(true);

    onMounted(async () => {
      try { data.value = await api.financing(props.finId); }
      catch (e) { console.error(e); }
      finally { loading.value = false; }
    });

    const opLabel = { issue: 'Выдача', additional_issue: 'Доп. выдача', chd: 'ЧДГ', full_repayment: 'Полное погашение', vop_transfer: 'Перевод ВОП', correction: 'Корректировка' };

    return { data, loading, fmt, fmtDate, fmtPct, opLabel };
  },
  template: `
    <div>
      <button @click="$emit('back')" style="display:inline-flex;align-items:center;gap:6px;color:#2563eb;font-size:14px;font-weight:600;background:none;border:none;cursor:pointer;margin-bottom:24px;padding:0">
        ← Назад к списку
      </button>

      <div v-if="loading" style="text-align:center;padding:80px"><div class="spinner"></div></div>

      <template v-else-if="data">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;margin-bottom:24px">
          <div>
            <div style="font-size:13px;color:#94a3b8;font-weight:600;margin-bottom:4px">Финансирование</div>
            <h1 style="font-size:26px;font-weight:800;color:#0f172a;margin-bottom:6px">{{data.fin.number}}</h1>
            <p style="color:#64748b;font-size:14px">
              Дебитор: <strong>{{data.fin.debtor_name}}</strong>
              <span style="margin-left:12px">BIN: {{data.fin.debtor_bin}}</span>
              <span v-if="data.fin.debtor_rating" style="margin-left:12px">
                Рейтинг: <span :class="['tag', data.fin.debtor_rating==='A'?'tag-green':data.fin.debtor_rating==='B'?'tag-blue':data.fin.debtor_rating==='C'?'tag-amber':'tag-red']">{{data.fin.debtor_rating}}</span>
              </span>
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

        <!-- Main figures -->
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

        <!-- Details grid -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px" class="grid-2">
          <!-- Document info -->
          <div class="cl-card" style="padding:24px">
            <h3 style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:16px">📄 Реквизиты документа</h3>
            <div style="display:flex;flex-direction:column;gap:10px">
              <div style="display:flex;justify-content:space-between;font-size:13px">
                <span style="color:#64748b">АВР №</span>
                <span style="font-weight:600">{{data.fin.avr_number || '—'}}</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:13px">
                <span style="color:#64748b">Дата АВР</span>
                <span style="font-weight:600">{{fmtDate(data.fin.avr_date)}}</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:13px">
                <span style="color:#64748b">Уведомление об уступке</span>
                <span style="font-weight:600;font-size:12px">{{data.fin.notice_number || '—'}}</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:13px">
                <span style="color:#64748b">Тариф</span>
                <span class="tag tag-violet">{{data.fin.tariff_name}}</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:13px">
                <span style="color:#64748b">Тип факторинга</span>
                <span style="font-weight:600">{{data.fin.factoring_type==='with_notice'?'С уведомлением':'Без уведомления'}}</span>
              </div>
            </div>
          </div>

          <!-- Dates & commissions -->
          <div class="cl-card" style="padding:24px">
            <h3 style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:16px">📅 Сроки и комиссии</h3>
            <div style="display:flex;flex-direction:column;gap:10px">
              <div style="display:flex;justify-content:space-between;font-size:13px">
                <span style="color:#64748b">Дата финансирования</span>
                <span style="font-weight:600">{{fmtDate(data.fin.date_financing)}}</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:13px">
                <span style="color:#64748b">Отсрочка платежа</span>
                <span style="font-weight:600">{{data.fin.installment_days}} дней</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:13px">
                <span style="color:#64748b">Плановое гашение</span>
                <span style="font-weight:600;color:#2563eb">{{fmtDate(data.fin.planned_repayment)}}</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:13px">
                <span style="color:#64748b">K1 начислено (без НДС)</span>
                <span style="font-weight:600">{{fmt(data.fin.k1_accrued_net)}}</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:13px">
                <span style="color:#64748b">K2 начислено (без НДС)</span>
                <span style="font-weight:600">{{fmt(data.fin.k2_accrued_net)}}</span>
              </div>
              <div v-if="data.fin.vop" style="display:flex;justify-content:space-between;font-size:13px;padding-top:8px;border-top:1px solid #f1f5f9">
                <span style="color:#64748b">ВОП</span>
                <span :style="{fontWeight:700, color: data.fin.vop > 0 ? '#16a34a' : '#dc2626'}">
                  {{fmt(data.fin.vop)}}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Operations history -->
        <div class="cl-card">
          <div style="padding:20px;border-bottom:1px solid #f1f5f9">
            <h3 style="font-size:15px;font-weight:700;color:#0f172a">История операций</h3>
          </div>
          <div v-if="data.operations?.length" style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr>
                  <th class="cl-th">Дата</th>
                  <th class="cl-th">Операция</th>
                  <th class="cl-th" style="text-align:right">Сумма</th>
                  <th class="cl-th" style="text-align:right">K1</th>
                  <th class="cl-th" style="text-align:right">K2</th>
                  <th class="cl-th" style="text-align:right">ОД уплачено</th>
                  <th class="cl-th" style="text-align:right">ОД после</th>
                  <th class="cl-th">Примечание</th>
                </tr>
              </thead>
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
