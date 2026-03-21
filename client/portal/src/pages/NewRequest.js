import { api } from '../api.js';
import { fmt, fmtDate, today } from '../utils.js';

export default {
  setup() {
    const { ref, computed, onMounted, watch } = Vue;
    const debtors = ref([]);
    const loading = ref(false);
    const sending = ref(false);
    const success = ref(null);
    const error = ref('');
    const profile = ref(null);

    const form = ref({
      debtor_id: '',
      avr_number: '',
      avr_date: today(),
      document_sum: '',
      installment_days: '30',
      comment: '',
    });

    const selectedDebtor = computed(() => debtors.value.find(d => d.id === form.value.debtor_id));
    const agreement = computed(() => profile.value?.agreement);

    const discount = computed(() => agreement.value?.default_discount || 0.85);
    const financingPreview = computed(() => {
      const s = parseFloat(form.value.document_sum);
      return isNaN(s) ? 0 : Math.round(s * discount.value * 100) / 100;
    });
    const plannedDate = computed(() => {
      if (!form.value.avr_date || !form.value.installment_days) return '';
      const d = new Date(form.value.avr_date);
      d.setDate(d.getDate() + parseInt(form.value.installment_days));
      return d.toISOString().split('T')[0];
    });

    const canSubmit = computed(() =>
      form.value.debtor_id && form.value.avr_number && form.value.avr_date &&
      parseFloat(form.value.document_sum) > 0 && parseInt(form.value.installment_days) > 0
    );

    const submit = async () => {
      error.value = '';
      sending.value = true;
      try {
        const r = await api.submitRequest({
          ...form.value,
          document_sum: parseFloat(form.value.document_sum),
          installment_days: parseInt(form.value.installment_days),
        });
        success.value = r;
        form.value = { debtor_id: '', avr_number: '', avr_date: today(), document_sum: '', installment_days: '30', comment: '' };
      } catch (e) {
        error.value = e.message || 'Ошибка при подаче заявки';
      } finally {
        sending.value = false;
      }
    };

    onMounted(async () => {
      loading.value = true;
      try {
        const [d, p] = await Promise.all([api.debtors(), api.profile()]);
        debtors.value = d.debtors || [];
        profile.value = p;
      } catch {}
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

      <!-- Success -->
      <div v-if="success" class="cl-alert cl-alert-success" style="margin-bottom:24px;font-size:15px">
        ✅ Заявка <strong>{{success.number}}</strong> успешно подана!
        <br><span style="font-size:13px;margin-top:6px;display:block">
          Сумма финансирования: <strong>{{fmt(success.financing_sum, true)}}</strong> &nbsp;·&nbsp;
          Плановое гашение: <strong>{{fmtDate(success.planned_repayment)}}</strong>
          <br>Наш менеджер свяжется с вами для подтверждения и подписания документов.
        </span>
      </div>

      <div style="display:grid;grid-template-columns:1fr 380px;gap:24px;align-items:start" class="grid-2">
        <!-- Form -->
        <div class="cl-card" style="padding:32px">
          <h3 style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:24px">Данные АВР / накладной</h3>

          <div v-if="loading" style="text-align:center;padding:40px"><div class="spinner"></div></div>

          <template v-else>
            <!-- Debtor -->
            <div style="margin-bottom:20px">
              <label class="cl-label">Дебитор (покупатель) *</label>
              <select v-model="form.debtor_id" class="cl-select">
                <option value="">— Выберите дебитора —</option>
                <option v-for="d in debtors" :key="d.id" :value="d.id">
                  {{d.name}} ({{d.bin}}) · Рейтинг: {{d.rating}}
                </option>
              </select>
              <div v-if="selectedDebtor" style="margin-top:8px;padding:10px 14px;background:#f0fdf4;border-radius:8px;font-size:13px">
                <span class="tag tag-green">Рейтинг {{selectedDebtor.rating}}</span>
                <span style="margin-left:10px;color:#64748b">{{selectedDebtor.industry}}</span>
                <span v-if="selectedDebtor.notification_signed" style="margin-left:10px;color:#16a34a;font-weight:600">✓ Уведомление подписано</span>
                <span v-else style="margin-left:10px;color:#b45309;font-weight:600">⚠ Уведомление не подписано</span>
              </div>
            </div>

            <!-- AVR number -->
            <div style="margin-bottom:20px">
              <label class="cl-label">Номер АВР / накладной *</label>
              <input v-model="form.avr_number" class="cl-input" placeholder="№0015 от 21.03.2026"/>
            </div>

            <!-- AVR date + installment -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">
              <div>
                <label class="cl-label">Дата АВР *</label>
                <input v-model="form.avr_date" type="date" class="cl-input"/>
              </div>
              <div>
                <label class="cl-label">Отсрочка (дней) *</label>
                <select v-model="form.installment_days" class="cl-select">
                  <option value="15">15 дней</option>
                  <option value="30">30 дней</option>
                  <option value="45">45 дней</option>
                  <option value="60">60 дней</option>
                  <option value="90">90 дней</option>
                  <option value="120">120 дней</option>
                </select>
              </div>
            </div>

            <!-- Sum -->
            <div style="margin-bottom:20px">
              <label class="cl-label">Сумма документа (₸) *</label>
              <input v-model="form.document_sum" type="number" class="cl-input" placeholder="5000000"/>
              <div v-if="financingPreview > 0" style="margin-top:8px;font-size:13px;color:#64748b">
                Предварительная сумма финансирования: <strong style="color:#2563eb">{{fmt(financingPreview, true)}}</strong>
                <span style="color:#94a3b8">(дисконт {{(discount*100).toFixed(0)}}%)</span>
              </div>
            </div>

            <!-- Comment -->
            <div style="margin-bottom:28px">
              <label class="cl-label">Комментарий</label>
              <textarea v-model="form.comment" class="cl-input" rows="3" style="resize:vertical" placeholder="Дополнительная информация..."></textarea>
            </div>

            <div v-if="error" class="cl-alert cl-alert-error">{{error}}</div>

            <button @click="submit" :disabled="!canSubmit || sending" class="cl-btn cl-btn-primary" style="width:100%;font-size:15px;padding:14px"
              :style="{opacity: !canSubmit || sending ? .6 : 1}">
              {{sending ? 'Отправляем...' : '📤 Подать заявку'}}
            </button>
          </template>
        </div>

        <!-- Info sidebar -->
        <div style="display:flex;flex-direction:column;gap:16px">
          <!-- Preview card -->
          <div class="cl-card" style="padding:20px">
            <h4 style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:14px">📊 Предварительный расчёт</h4>
            <div style="display:flex;flex-direction:column;gap:10px;font-size:13px">
              <div style="display:flex;justify-content:space-between">
                <span style="color:#64748b">Сумма документа</span>
                <span style="font-weight:600">{{fmt(parseFloat(form.document_sum)||0)}}</span>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span style="color:#64748b">Дисконт {{(discount*100).toFixed(0)}}%</span>
                <span style="font-weight:600;color:#2563eb">{{fmt(financingPreview)}}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid #f1f5f9">
                <span style="color:#64748b">Плановое гашение</span>
                <span style="font-weight:600;color:#0891b2">{{fmtDate(plannedDate)||'—'}}</span>
              </div>
              <div v-if="agreement" style="display:flex;justify-content:space-between">
                <span style="color:#64748b">K1 ставка</span>
                <span style="font-weight:600;color:#7c3aed">{{((agreement.k1_rate||0)*100).toFixed(1)}}% год.</span>
              </div>
              <div v-if="agreement?.k2_rate_0_30" style="display:flex;justify-content:space-between">
                <span style="color:#64748b">K2 (0–30 дн.)</span>
                <span style="font-weight:600;color:#7c3aed">{{(agreement.k2_rate_0_30).toFixed(3)}}%</span>
              </div>
            </div>
          </div>

          <!-- Process steps -->
          <div class="cl-card" style="padding:20px">
            <h4 style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:14px">🚀 Как это работает</h4>
            <div style="display:flex;flex-direction:column;gap:12px">
              <div v-for="(step, i) in [
                {title:'Подаёте заявку', desc:'Заполняете форму с данными АВР и суммой'},
                {title:'Верификация', desc:'Менеджер проверяет документы (1–2 дня)'},
                {title:'Получаете деньги', desc:'Аванс переводится на счёт в день выдачи'},
                {title:'Дебитор платит', desc:'Покупатель погашает долг в срок по уведомлению'},
                {title:'Получаете ВОП', desc:'Остаток (за вычетом комиссий) возвращается вам'},
              ]" :key="i" style="display:flex;gap:10px;align-items:flex-start">
                <div style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;margin-top:1px">{{i+1}}</div>
                <div>
                  <div style="font-size:13px;font-weight:700;color:#0f172a">{{step.title}}</div>
                  <div style="font-size:12px;color:#64748b;margin-top:2px">{{step.desc}}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Required docs -->
          <div class="cl-card" style="padding:20px">
            <h4 style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:12px">📎 Необходимые документы</h4>
            <ul style="font-size:13px;color:#64748b;padding-left:18px;margin:0;line-height:1.8">
              <li>АВР или товарная накладная</li>
              <li>Счёт-фактура (ЭСФ)</li>
              <li>Договор поставки с дебитором</li>
              <li>Доверенность (если нужна)</li>
            </ul>
            <div style="margin-top:12px;font-size:12px;color:#94a3b8">После одобрения менеджер запросит оригиналы</div>
          </div>
        </div>
      </div>
    </div>
  `
};
