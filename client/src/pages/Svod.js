import { api } from '../api.js';
import { fmt, fmtDate, daysUntil, statusTag } from '../utils.js';

export default {
  emits: ['navigate'],
  setup(props, { emit }) {
    const { ref, onMounted } = Vue;
    const rows = ref([]);
    const total_od = ref(0);
    const loading = ref(true);

    onMounted(async () => {
      try {
        const r = await api.svod();
        rows.value = r.data;
        total_od.value = r.total_od;
      } catch (e) { console.error(e); }
      finally { loading.value = false; }
    });

    return { rows, total_od, loading, fmt, fmtDate, daysUntil, statusTag };
  },
  template: `
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <div>
          <h1 style="font-size:22px;font-weight:700;color:#111827">Свод активных финансирований</h1>
          <p style="color:#6b7280;font-size:14px;margin-top:2px">
            {{rows.length}} позиций | Общий ОД: <strong>{{fmt(total_od)}}</strong>
          </p>
        </div>
      </div>

      <div class="card" style="overflow:hidden">
        <div v-if="loading" style="text-align:center;padding:40px"><div class="spinner"></div></div>
        <div v-else-if="!rows.length" style="text-align:center;padding:40px;color:#6b7280">Нет активных финансирований</div>
        <table v-else style="width:100%;border-collapse:collapse">
          <thead>
            <tr>
              <th class="th">№</th>
              <th class="th">Клиент</th>
              <th class="th">Дебитор</th>
              <th class="th">Уведомление</th>
              <th class="th">Дата фин-я</th>
              <th class="th">Сумма уступки</th>
              <th class="th">Финансирование</th>
              <th class="th">ОД</th>
              <th class="th">K1 нач.</th>
              <th class="th">K2 нач.</th>
              <th class="th">План. гашение</th>
              <th class="th">Тариф</th>
              <th class="th">Статус</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in rows" :key="f.id"
                :class="{'overdue-row': f.status==='overdue'||f.status==='default'}"
                style="cursor:pointer"
                @click="$emit('navigate','financing-detail',f.id)">
              <td class="td" style="font-weight:600;color:#2563eb;white-space:nowrap">{{f.number}}</td>
              <td class="td" style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{f.client_name}}</td>
              <td class="td" style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{f.debtor_name}}</td>
              <td class="td" style="font-size:12px;color:#6b7280;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{f.notice_number || '—'}}</td>
              <td class="td" style="white-space:nowrap">{{fmtDate(f.date_financing)}}</td>
              <td class="td" style="text-align:right;white-space:nowrap">{{fmt(f.document_sum)}}</td>
              <td class="td" style="text-align:right;white-space:nowrap">{{fmt(f.financing_sum)}}</td>
              <td class="td" style="text-align:right;font-weight:700;color:#dc2626;white-space:nowrap">{{fmt(f.current_od)}}</td>
              <td class="td" style="text-align:right;color:#15803d;white-space:nowrap">{{fmt(f.k1_accrued_net)}}</td>
              <td class="td" style="text-align:right;color:#1d4ed8;white-space:nowrap">{{fmt(f.k2_accrued_net)}}</td>
              <td class="td" style="white-space:nowrap">
                <div>{{fmtDate(f.planned_repayment)}}</div>
                <span :class="'tag ' + daysUntil(f.planned_repayment, f.status).cls" style="font-size:10px">
                  {{daysUntil(f.planned_repayment, f.status).text}}
                </span>
              </td>
              <td class="td"><span class="tag tag-violet" style="font-size:11px">{{f.tariff_name}}</span></td>
              <td class="td"><span :class="'tag ' + statusTag(f.status).cls">{{statusTag(f.status).text}}</span></td>
            </tr>
          </tbody>
          <tfoot>
            <tr style="background:#f8fafc">
              <td class="td" colspan="7" style="font-weight:700;text-align:right">ИТОГО ОД:</td>
              <td class="td" style="font-weight:800;font-size:15px;color:#dc2626;text-align:right">{{fmt(total_od)}}</td>
              <td class="td" colspan="5"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  `
};
