import { api } from '../api.js';
import { fmt, fmtDate, today } from '../utils.js';

export default {
  setup() {
    const { ref, onMounted } = Vue;
    const rows = ref([]);
    const loading = ref(true);
    const showModal = ref(false);
    const msg = ref('');
    const form = ref({
      direction: 'incoming', payment_type: 'debtor_payment',
      payment_date: today(), amount: '', counterparty_name: '', purpose: ''
    });

    const load = async () => {
      loading.value = true;
      try { const r = await api.payments({ limit: 100 }); rows.value = r.data; }
      catch (e) { console.error(e); }
      finally { loading.value = false; }
    };

    const submit = async () => {
      try {
        await api.createPayment({ ...form.value, amount: parseFloat(form.value.amount) });
        showModal.value = false;
        form.value = { direction: 'incoming', payment_type: 'debtor_payment', payment_date: today(), amount: '', counterparty_name: '', purpose: '' };
        await load();
      } catch (e) { msg.value = e.message; }
    };

    const execute = async (id) => {
      try { await api.executePayment(id); await load(); } catch (e) { alert(e.message); }
    };

    onMounted(load);

    const directionMap = { outgoing: { label: 'Исходящее', cls: 'tag-red' }, incoming: { label: 'Входящее', cls: 'tag-green' } };
    const statusMap = { draft: 'Черновик', sent: 'Отправлено', executed: 'Исполнено', rejected: 'Отклонено' };
    const statusCls = { draft: 'tag-gray', sent: 'tag-blue', executed: 'tag-green', rejected: 'tag-red' };

    return { rows, loading, showModal, form, msg, submit, execute, fmt, fmtDate, directionMap, statusMap, statusCls };
  },
  template: `
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <h1 style="font-size:22px;font-weight:700;color:#111827">Платёжные поручения</h1>
        <button class="btn btn-primary" @click="showModal=true">+ Добавить ПП</button>
      </div>

      <div class="card" style="overflow:hidden">
        <div v-if="loading" style="text-align:center;padding:40px"><div class="spinner"></div></div>
        <div v-else-if="!rows.length" style="text-align:center;padding:40px;color:#6b7280">Нет платёжных поручений</div>
        <table v-else style="width:100%;border-collapse:collapse">
          <thead><tr>
            <th class="th">Дата</th><th class="th">Направление</th>
            <th class="th">Сумма</th><th class="th">Контрагент</th>
            <th class="th">Назначение</th><th class="th">Статус</th><th class="th">Действие</th>
          </tr></thead>
          <tbody>
            <tr v-for="p in rows" :key="p.id">
              <td class="td">{{fmtDate(p.payment_date)}}</td>
              <td class="td"><span :class="'tag ' + directionMap[p.direction].cls">{{directionMap[p.direction].label}}</span></td>
              <td class="td" style="text-align:right;font-weight:600">{{fmt(p.amount)}}</td>
              <td class="td">{{p.counterparty_name || '—'}}</td>
              <td class="td" style="font-size:12px;color:#6b7280;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{p.purpose || '—'}}</td>
              <td class="td"><span :class="'tag ' + statusCls[p.status]">{{statusMap[p.status]}}</span></td>
              <td class="td">
                <button v-if="p.status!=='executed'" class="btn btn-secondary btn-sm" @click="execute(p.id)">Исполнить</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="showModal" class="modal-backdrop" @click.self="showModal=false">
        <div class="modal" style="max-width:480px">
          <div style="padding:20px;border-bottom:1px solid #e5e7eb">
            <h3 style="font-size:16px;font-weight:700">Новое ПП</h3>
          </div>
          <div style="padding:20px">
            <div v-if="msg" class="alert alert-error">{{msg}}</div>
            <div class="form-grid form-grid-2">
              <div>
                <label class="lbl">Направление</label>
                <select class="sel" v-model="form.direction">
                  <option value="outgoing">Исходящее</option>
                  <option value="incoming">Входящее</option>
                </select>
              </div>
              <div>
                <label class="lbl">Дата</label>
                <input type="date" class="inp" v-model="form.payment_date">
              </div>
              <div>
                <label class="lbl">Сумма, ₸ *</label>
                <input type="number" class="inp" v-model="form.amount">
              </div>
              <div>
                <label class="lbl">Контрагент</label>
                <input class="inp" v-model="form.counterparty_name">
              </div>
              <div style="grid-column:1/-1">
                <label class="lbl">Назначение платежа</label>
                <input class="inp" v-model="form.purpose">
              </div>
            </div>
            <div style="margin-top:16px;display:flex;gap:8px">
              <button class="btn btn-primary" @click="submit">Сохранить</button>
              <button class="btn btn-secondary" @click="showModal=false">Отмена</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};
