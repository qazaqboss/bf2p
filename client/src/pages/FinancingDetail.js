import { api } from '../api.js';
import { fmt, fmtDate, fmtPct, statusTag, daysUntil, today } from '../utils.js';

export default {
  props: ['id'],
  emits: ['navigate'],
  setup(props, { emit }) {
    const { ref, onMounted, computed } = Vue;
    const fin = ref(null);
    const ops = ref([]);
    const preview = ref(null);
    const loading = ref(true);
    const msg = ref('');
    const msgType = ref('success');
    const previewDate = ref(today());
    const showPayment = ref(false);
    const showOpen = ref(false);

    // Payment form
    const pmtForm = ref({ amount: '', payment_date: today(), source: 'debtor', note: '' });
    const openDate = ref(today());

    const load = async () => {
      loading.value = true;
      try {
        const r = await api.financing(props.id);
        fin.value = r.financing;
        ops.value = r.operations;
        await loadPreview();
      } catch (e) { showMsg(e.message, 'error'); }
      finally { loading.value = false; }
    };

    const loadPreview = async () => {
      if (!fin.value?.date_financing) return;
      try { preview.value = await api.previewCalc(props.id, previewDate.value); } catch {}
    };

    const openFinancing = async () => {
      try {
        await api.openFinancing(props.id, openDate.value);
        showMsg('Финансирование открыто', 'success');
        showOpen.value = false;
        await load();
      } catch (e) { showMsg(e.message, 'error'); }
    };

    const applyPayment = async () => {
      try {
        const r = await api.applyPayment(props.id, {
          amount: parseFloat(pmtForm.value.amount),
          payment_date: pmtForm.value.payment_date,
          source: pmtForm.value.source,
          note: pmtForm.value.note,
        });
        showMsg(r.message + (r.negativeVopWarning ? ' | ' + r.negativeVopWarning : '') +
          (r.overpaymentWarning ? ' | ' + r.overpaymentWarning : ''),
          r.isClosed ? 'success' : 'success');
        showPayment.value = false;
        pmtForm.value = { amount: '', payment_date: today(), source: 'debtor', note: '' };
        await load();
      } catch (e) { showMsg(e.message, 'error'); }
    };

    const showMsg = (m, t = 'success') => {
      msg.value = m; msgType.value = t;
      setTimeout(() => msg.value = '', 6000);
    };

    onMounted(load);

    return {
      fin, ops, preview, loading, msg, msgType,
      previewDate, showPayment, showOpen, pmtForm, openDate,
      loadPreview, openFinancing, applyPayment,
      fmt, fmtDate, fmtPct, statusTag, daysUntil, today
    };
  },
  template: `
    <div v-if="loading" style="text-align:center;padding:80px"><div class="spinner"></div></div>
    <div v-else-if="fin">
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px">
        <div>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
            <button @click="$emit('navigate','financings')" style="background:none;border:none;color:#6b7280;cursor:pointer;font-size:14px;padding:0">← Назад</button>
          </div>
          <h1 style="font-size:22px;font-weight:700;color:#111827">{{fin.number}}</h1>
          <div style="display:flex;align-items:center;gap:10px;margin-top:6px">
            <span :class="'tag ' + statusTag(fin.status).cls">{{statusTag(fin.status).text}}</span>
            <span class="tag tag-violet" style="font-size:12px">{{fin.tariff_name}}</span>
            <span style="font-size:13px;color:#6b7280">{{fin.factoring_type === 'with_notice' ? 'С уведомлением' : 'Без уведомления'}}</span>
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <button v-if="fin.status==='draft'" class="btn btn-primary" @click="showOpen=true">Выдать аванс</button>
          <button v-if="fin.status!=='draft' && fin.status!=='closed'" class="btn btn-success" @click="showPayment=true">Внести платёж</button>
        </div>
      </div>

      <!-- Alert -->
      <div v-if="msg" :class="'alert alert-' + msgType">{{msg}}</div>

      <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px">
        <!-- Основная информация -->
        <div>
          <div class="card" style="padding:20px;margin-bottom:16px">
            <h3 style="font-size:14px;font-weight:700;color:#111827;margin-bottom:16px;text-transform:uppercase;letter-spacing:.03em">Основные данные</h3>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
              <div><div class="lbl">Клиент</div><div style="font-size:14px;font-weight:600">{{fin.client_name}}</div></div>
              <div><div class="lbl">Дебитор</div><div style="font-size:14px;font-weight:600">{{fin.debtor_name}}</div></div>
              <div><div class="lbl">Номер уведомления</div><div style="font-size:14px">{{fin.notice_number || '—'}}</div></div>
              <div><div class="lbl">Номер АВР</div><div style="font-size:14px">{{fin.avr_number || '—'}}</div></div>
              <div><div class="lbl">Дата АВР</div><div style="font-size:14px">{{fmtDate(fin.avr_date)}}</div></div>
              <div><div class="lbl">Отсрочка</div><div style="font-size:14px">{{fin.installment_days}} дней</div></div>
              <div><div class="lbl">Дата финансирования</div><div style="font-size:14px">{{fmtDate(fin.date_financing)}}</div></div>
              <div><div class="lbl">Плановое гашение</div>
                <div style="font-size:14px">{{fmtDate(fin.planned_repayment)}}
                  <span :class="'tag ' + daysUntil(fin.planned_repayment, fin.status).cls" style="margin-left:6px;font-size:11px">
                    {{daysUntil(fin.planned_repayment, fin.status).text}}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Финансовые показатели -->
          <div class="card" style="padding:20px;margin-bottom:16px">
            <h3 style="font-size:14px;font-weight:700;color:#111827;margin-bottom:16px;text-transform:uppercase;letter-spacing:.03em">Финансовые показатели</h3>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
              <div style="background:#f8fafc;border-radius:8px;padding:12px">
                <div class="lbl">Сумма уступки</div>
                <div style="font-size:16px;font-weight:700;color:#111827">{{fmt(fin.document_sum)}}</div>
              </div>
              <div style="background:#f8fafc;border-radius:8px;padding:12px">
                <div class="lbl">Финансирование ({{Math.round(fin.discount*100)}}%)</div>
                <div style="font-size:16px;font-weight:700;color:#111827">{{fmt(fin.financing_sum)}}</div>
              </div>
              <div style="background:#fef2f2;border-radius:8px;padding:12px">
                <div class="lbl">Основной долг (ОД)</div>
                <div style="font-size:16px;font-weight:700;color:#dc2626">{{fmt(fin.current_od)}}</div>
              </div>
              <div style="background:#f0fdf4;border-radius:8px;padding:12px">
                <div class="lbl">K1 начислено (net)</div>
                <div style="font-size:16px;font-weight:700;color:#15803d">{{fmt(fin.k1_accrued_net)}}</div>
                <div style="font-size:11px;color:#6b7280">{{fmtPct(fin.k1_rate)}} годовых</div>
              </div>
              <div style="background:#eff6ff;border-radius:8px;padding:12px">
                <div class="lbl">K2 начислено (net)</div>
                <div style="font-size:16px;font-weight:700;color:#1d4ed8">{{fmt(fin.k2_accrued_net)}}</div>
              </div>
              <div style="background:#fdf4ff;border-radius:8px;padding:12px">
                <div class="lbl">ВОП</div>
                <div style="font-size:16px;font-weight:700;color:#7c3aed">{{fin.vop !== null ? fmt(fin.vop) : '—'}}</div>
              </div>
            </div>
          </div>

          <!-- Операции -->
          <div class="card" style="overflow:hidden">
            <div style="padding:16px 20px;border-bottom:1px solid #f3f4f6">
              <h3 style="font-size:14px;font-weight:700;color:#111827;text-transform:uppercase;letter-spacing:.03em">История операций</h3>
            </div>
            <div v-if="!ops.length" style="padding:20px;color:#6b7280;font-size:14px">Нет операций</div>
            <div class="table-wrap"><table v-else style="width:100%;border-collapse:collapse">
              <thead>
                <tr>
                  <th class="th">Дата</th>
                  <th class="th">Тип</th>
                  <th class="th">Сумма</th>
                  <th class="th">K1 погаш.</th>
                  <th class="th">K2 погаш.</th>
                  <th class="th">ОД погаш.</th>
                  <th class="th">ОД после</th>
                  <th class="th">Источник</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="op in ops" :key="op.id">
                  <td class="td">{{fmtDate(op.operation_date)}}</td>
                  <td class="td">
                    <span :class="'tag ' + {issue:'tag-blue',additional_issue:'tag-blue',chd:'tag-amber',full_repayment:'tag-green',vop_transfer:'tag-violet',correction:'tag-gray'}[op.type]">
                      {{{'issue':'Выдача','additional_issue':'Доп.выдача','chd':'ЧДГ','full_repayment':'Полное гашение','vop_transfer':'ВОП','correction':'Корректировка'}[op.type] || op.type}}
                    </span>
                  </td>
                  <td class="td" style="text-align:right;font-weight:600">{{fmt(op.amount)}}</td>
                  <td class="td" style="text-align:right;color:#15803d">{{op.k1_paid > 0 ? fmt(op.k1_paid) : '—'}}</td>
                  <td class="td" style="text-align:right;color:#1d4ed8">{{op.k2_paid > 0 ? fmt(op.k2_paid) : '—'}}</td>
                  <td class="td" style="text-align:right">{{op.od_paid > 0 ? fmt(op.od_paid) : '—'}}</td>
                  <td class="td" style="text-align:right;font-weight:600">{{fmt(op.od_after)}}</td>
                  <td class="td" style="font-size:12px;color:#6b7280">{{op.source}}</td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>
        </div>

        <!-- Правая панель -->
        <div>
          <!-- Предварительный расчёт -->
          <div class="card" style="padding:20px;margin-bottom:16px">
            <h3 style="font-size:14px;font-weight:700;color:#111827;margin-bottom:12px;text-transform:uppercase;letter-spacing:.03em">Предварительный расчёт</h3>
            <div style="margin-bottom:10px">
              <label class="lbl">Дата расчёта</label>
              <input type="date" class="inp" v-model="previewDate" @change="loadPreview">
            </div>
            <div v-if="fin.date_financing && preview && preview.ready">
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px">
                <span style="color:#6b7280">Дней K1 (с след. дня)</span>
                <span style="font-weight:600">{{preview.k1Days}} дн.</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px">
                <span style="color:#6b7280">Дней K2 (нараст.)</span>
                <span style="font-weight:600">{{preview.k2Days}} дн.</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px">
                <span style="color:#6b7280">K1 за период (net)</span>
                <span style="font-weight:600;color:#15803d">{{fmt(preview.k1?.net)}}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px">
                <span style="color:#6b7280">K1 НДС (16%)</span>
                <span>{{fmt(preview.k1?.vat)}}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px">
                <span style="color:#6b7280">K2 приращение (net)</span>
                <span style="font-weight:600;color:#1d4ed8">{{fmt(preview.k2?.net)}}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:10px 0;font-size:14px;font-weight:700">
                <span>Итого (gross)</span>
                <span style="color:#111827">{{fmt(preview.totalGross)}}</span>
              </div>
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:2px solid #e5e7eb;font-size:14px;font-weight:700">
                <span style="color:#7c3aed">ВОП</span>
                <span :style="preview.vop < 0 ? 'color:#dc2626' : 'color:#15803d'">{{fmt(preview.vop)}}</span>
              </div>
            </div>
            <div v-else-if="!fin.date_financing" style="color:#6b7280;font-size:13px">Финансирование не выдано</div>
          </div>
        </div>
      </div>

      <!-- Modal: Выдача аванса -->
      <div v-if="showOpen" class="modal-backdrop" @click.self="showOpen=false">
        <div class="modal" style="max-width:400px">
          <div style="padding:20px;border-bottom:1px solid #e5e7eb">
            <h3 style="font-size:16px;font-weight:700">Выдать аванс</h3>
          </div>
          <div style="padding:20px">
            <p style="font-size:14px;color:#374151;margin-bottom:16px">
              Сумма финансирования: <strong>{{fmt(fin.financing_sum)}}</strong>
            </p>
            <div style="margin-bottom:16px">
              <label class="lbl">Дата выдачи</label>
              <input type="date" class="inp" v-model="openDate">
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-primary" @click="openFinancing">Подтвердить</button>
              <button class="btn btn-secondary" @click="showOpen=false">Отмена</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal: Платёж -->
      <div v-if="showPayment" class="modal-backdrop" @click.self="showPayment=false">
        <div class="modal" style="max-width:460px">
          <div style="padding:20px;border-bottom:1px solid #e5e7eb">
            <h3 style="font-size:16px;font-weight:700">Внести платёж (ЧДГ)</h3>
          </div>
          <div style="padding:20px">
            <div style="display:grid;gap:14px">
              <div>
                <label class="lbl">Сумма платежа, ₸</label>
                <input type="number" class="inp" v-model="pmtForm.amount" placeholder="0.00">
              </div>
              <div>
                <label class="lbl">Дата платежа</label>
                <input type="date" class="inp" v-model="pmtForm.payment_date">
              </div>
              <div>
                <label class="lbl">Источник платежа</label>
                <select class="sel" v-model="pmtForm.source">
                  <option value="debtor">Дебитор</option>
                  <option value="client">Клиент</option>
                  <option value="third_party">Третье лицо</option>
                </select>
              </div>
              <div>
                <label class="lbl">Примечание</label>
                <input class="inp" v-model="pmtForm.note" placeholder="Необязательно">
              </div>
            </div>
            <div style="margin-top:16px;display:flex;gap:8px">
              <button class="btn btn-primary" @click="applyPayment">Применить платёж</button>
              <button class="btn btn-secondary" @click="showPayment=false">Отмена</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};
