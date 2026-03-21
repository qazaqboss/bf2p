import { api } from '../api.js';
import { fmt, fmtDate, daysUntil, statusTag, debounce } from '../utils.js';

export default {
  emits: ['navigate'],
  setup(props, { emit }) {
    const { ref, onMounted, watch } = Vue;
    const rows = ref([]);
    const loading = ref(true);
    const search = ref('');
    const statusFilter = ref('');
    const total = ref(0);

    const load = async () => {
      loading.value = true;
      try {
        const q = {};
        if (search.value) q.search = search.value;
        if (statusFilter.value) q.status = statusFilter.value;
        q.limit = 100;
        const r = await api.financings(q);
        rows.value = r.data;
        total.value = r.total;
      } catch (e) { console.error(e); }
      finally { loading.value = false; }
    };

    const debouncedLoad = debounce(load, 300);
    onMounted(load);
    watch(search, debouncedLoad);
    watch(statusFilter, load);

    return { rows, loading, search, statusFilter, total, fmt, fmtDate, daysUntil, statusTag };
  },
  template: `
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <div>
          <h1 style="font-size:22px;font-weight:700;color:#111827">Финансирования</h1>
          <p style="color:#6b7280;font-size:14px;margin-top:2px">Всего: {{total}} записей</p>
        </div>
        <button class="btn btn-primary" @click="$emit('navigate','new-financing')">+ Новое финансирование</button>
      </div>

      <!-- Фильтры -->
      <div style="display:flex;gap:12px;margin-bottom:16px">
        <input class="inp" v-model="search" placeholder="Поиск по клиенту, дебитору, номеру..." style="max-width:360px">
        <select class="sel" v-model="statusFilter" style="max-width:180px">
          <option value="">Все статусы</option>
          <option value="draft">Черновик</option>
          <option value="open">Открыто</option>
          <option value="overdue">Просрочка</option>
          <option value="default">Дефолт</option>
          <option value="closed">Закрыто</option>
        </select>
      </div>

      <div class="card" style="overflow:hidden">
        <div v-if="loading" style="text-align:center;padding:40px"><div class="spinner"></div></div>
        <div v-else-if="!rows.length" style="text-align:center;padding:40px;color:#6b7280">Ничего не найдено</div>
        <div class="table-wrap"><table v-else style="width:100%;border-collapse:collapse">
          <thead>
            <tr>
              <th class="th">№</th>
              <th class="th">Клиент</th>
              <th class="th">Дебитор</th>
              <th class="th">АВР</th>
              <th class="th">Сумма уступки</th>
              <th class="th">ОД</th>
              <th class="th">Плановое гашение</th>
              <th class="th">Тариф</th>
              <th class="th">Статус</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in rows" :key="f.id"
                :class="{'overdue-row': f.status==='overdue'||f.status==='default'}"
                style="cursor:pointer"
                @click="$emit('navigate','financing-detail',f.id)">
              <td class="td" style="font-weight:600;color:#2563eb">{{f.number}}</td>
              <td class="td">
                <div style="font-weight:500">{{f.client_name}}</div>
                <div style="font-size:12px;color:#6b7280">{{f.notice_number || f.avr_number}}</div>
              </td>
              <td class="td">{{f.debtor_name}}</td>
              <td class="td">{{fmtDate(f.avr_date)}}</td>
              <td class="td" style="text-align:right">{{fmt(f.document_sum)}}</td>
              <td class="td" style="text-align:right;font-weight:600">
                <span :style="f.current_od > 0 ? 'color:#dc2626' : 'color:#15803d'">{{fmt(f.current_od)}}</span>
              </td>
              <td class="td">
                <div>{{fmtDate(f.planned_repayment)}}</div>
                <span :class="'tag ' + daysUntil(f.planned_repayment, f.status).cls" style="font-size:11px;margin-top:2px">
                  {{daysUntil(f.planned_repayment, f.status).text}}
                </span>
              </td>
              <td class="td">
                <span class="tag tag-violet" style="font-size:11px">{{f.tariff_name}}</span>
              </td>
              <td class="td">
                <span :class="'tag ' + statusTag(f.status).cls">{{statusTag(f.status).text}}</span>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>
    </div>
  `
};
