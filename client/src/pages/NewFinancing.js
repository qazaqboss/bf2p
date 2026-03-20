import { api } from '../api.js';
import { fmt, fmtDate, today } from '../utils.js';

export default {
  emits: ['navigate'],
  setup(props, { emit }) {
    const { ref, computed, onMounted, watch } = Vue;

    const clients = ref([]);
    const debtors = ref([]);
    const tariffs = ref([]);
    const agreements = ref([]);

    const form = ref({
      client_id: '', debtor_id: '', agreement_id: '', tariff_plan_id: '',
      notice_number: '', avr_number: '', avr_date: today(),
      installment_days: 30, document_sum: '', discount: 0.85,
      guarantee_retention: 0, financing_sum_manual: false, financing_sum: '',
      factoring_type: 'with_notice', comment: '',
    });

    const msg = ref('');
    const msgType = ref('success');
    const loading = ref(false);

    const calcFinancingSum = computed(() => {
      if (form.value.financing_sum_manual) return parseFloat(form.value.financing_sum) || 0;
      const ds = parseFloat(form.value.document_sum) || 0;
      return Math.round(ds * parseFloat(form.value.discount) * 100) / 100;
    });

    const calcPlannedRepayment = computed(() => {
      if (!form.value.avr_date || !form.value.installment_days) return '';
      const d = new Date(form.value.avr_date);
      d.setDate(d.getDate() + parseInt(form.value.installment_days));
      return fmtDate(d.toISOString().split('T')[0]);
    });

    onMounted(async () => {
      [clients.value, debtors.value, tariffs.value] = await Promise.all([
        api.clients({ limit: 200 }),
        api.debtors({ limit: 200 }),
        api.tariffs(),
      ]);
    });

    // Когда выбрали клиента, подтянуть ГД
    watch(() => form.value.client_id, async (id) => {
      if (!id) { agreements.value = []; return; }
      // Simple: find agreements from clients endpoint
      agreements.value = [];
      form.value.agreement_id = '';
    });

    const submit = async () => {
      loading.value = true;
      try {
        const data = { ...form.value };
        data.document_sum = parseFloat(data.document_sum);
        data.discount = parseFloat(data.discount);
        data.installment_days = parseInt(data.installment_days);
        if (!data.financing_sum_manual) delete data.financing_sum;
        else data.financing_sum = parseFloat(data.financing_sum);

        const r = await api.createFinancing(data);
        emit('navigate', 'financing-detail', r.id);
      } catch (e) {
        msg.value = e.message;
        msgType.value = 'error';
        setTimeout(() => msg.value = '', 5000);
      } finally { loading.value = false; }
    };

    return {
      clients, debtors, tariffs, agreements, form,
      msg, msgType, loading, calcFinancingSum, calcPlannedRepayment, submit, fmt
    };
  },
  template: `
    <div style="max-width:800px">
      <div style="margin-bottom:20px">
        <button @click="$emit('navigate','financings')" style="background:none;border:none;color:#6b7280;cursor:pointer;font-size:14px;padding:0">← Назад</button>
        <h1 style="font-size:22px;font-weight:700;color:#111827;margin-top:8px">Новое финансирование</h1>
      </div>

      <div v-if="msg" :class="'alert alert-' + msgType">{{msg}}</div>

      <div class="card" style="padding:24px">
        <!-- Стороны -->
        <h3 style="font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:16px">Стороны сделки</h3>
        <div class="form-grid form-grid-2" style="margin-bottom:20px">
          <div>
            <label class="lbl">Клиент (поставщик) *</label>
            <select class="sel" v-model="form.client_id">
              <option value="">— Выберите клиента —</option>
              <option v-for="c in clients" :key="c.id" :value="c.id">{{c.name}}</option>
            </select>
          </div>
          <div>
            <label class="lbl">Дебитор *</label>
            <select class="sel" v-model="form.debtor_id">
              <option value="">— Выберите дебитора —</option>
              <option v-for="d in debtors" :key="d.id" :value="d.id">{{d.name}}</option>
            </select>
          </div>
          <div>
            <label class="lbl">Тарифный план *</label>
            <select class="sel" v-model="form.tariff_plan_id">
              <option value="">— Выберите тариф —</option>
              <optgroup v-for="s in ['F1','F2','F4','F5','F6']" :key="s" :label="'Серия ' + s">
                <option v-for="t in tariffs.filter(x=>x.series===s)" :key="t.id" :value="t.id">
                  {{t.name}} (K1: {{(t.k1_rate*100).toFixed(2)}}%)
                </option>
              </optgroup>
            </select>
          </div>
          <div>
            <label class="lbl">Тип факторинга</label>
            <select class="sel" v-model="form.factoring_type">
              <option value="with_notice">С уведомлением дебитора</option>
              <option value="without_notice">Без уведомления</option>
            </select>
          </div>
        </div>

        <hr style="margin:0 0 20px;border:none;border-top:1px solid #e5e7eb">

        <!-- Документы -->
        <h3 style="font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:16px">Документы</h3>
        <div class="form-grid form-grid-2" style="margin-bottom:20px">
          <div>
            <label class="lbl">Номер уведомления</label>
            <input class="inp" v-model="form.notice_number" placeholder="Уведомление №... от ...">
          </div>
          <div>
            <label class="lbl">Номер АВР *</label>
            <input class="inp" v-model="form.avr_number" placeholder="№ ... от ...">
          </div>
          <div>
            <label class="lbl">Дата АВР *</label>
            <input type="date" class="inp" v-model="form.avr_date">
          </div>
          <div>
            <label class="lbl">Отсрочка (дней) *</label>
            <input type="number" class="inp" v-model="form.installment_days" min="1" max="365">
          </div>
        </div>

        <hr style="margin:0 0 20px;border:none;border-top:1px solid #e5e7eb">

        <!-- Суммы -->
        <h3 style="font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-bottom:16px">Суммы</h3>
        <div class="form-grid form-grid-3" style="margin-bottom:20px">
          <div>
            <label class="lbl">Сумма уступки (АВР), ₸ *</label>
            <input type="number" class="inp" v-model="form.document_sum" placeholder="0.00">
          </div>
          <div>
            <label class="lbl">Дисконт</label>
            <input type="number" class="inp" v-model="form.discount" step="0.01" min="0.01" max="1">
          </div>
          <div>
            <label class="lbl">Гарантийный резерв</label>
            <input type="number" class="inp" v-model="form.guarantee_retention" step="0.01" min="0" max="1">
          </div>
        </div>

        <!-- Расчётная сумма финансирования -->
        <div style="background:#eff6ff;border-radius:10px;padding:16px;margin-bottom:20px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-size:13px;font-weight:600;color:#1d4ed8">Сумма финансирования</div>
              <div style="font-size:24px;font-weight:800;color:#1d4ed8;margin-top:4px">{{fmt(calcFinancingSum)}}</div>
              <div style="font-size:12px;color:#6b7280;margin-top:2px">Плановое гашение: {{calcPlannedRepayment}}</div>
            </div>
            <div>
              <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
                <input type="checkbox" v-model="form.financing_sum_manual">
                Ввести вручную
              </label>
              <input v-if="form.financing_sum_manual" type="number" class="inp" v-model="form.financing_sum"
                     placeholder="Сумма вручную" style="margin-top:8px">
            </div>
          </div>
        </div>

        <div>
          <label class="lbl">Комментарий</label>
          <input class="inp" v-model="form.comment" placeholder="Необязательно">
        </div>

        <div style="margin-top:24px;display:flex;gap:8px">
          <button class="btn btn-primary" @click="submit" :disabled="loading">
            <span v-if="loading" class="spinner" style="width:14px;height:14px"></span>
            {{loading ? 'Создание...' : 'Создать финансирование'}}
          </button>
          <button class="btn btn-secondary" @click="$emit('navigate','financings')">Отмена</button>
        </div>
      </div>
    </div>
  `
};
