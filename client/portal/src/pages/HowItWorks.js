export default {
  template: `
    <div>
      <div style="margin-bottom:32px">
        <h1 style="font-size:24px;font-weight:800;color:#0f172a">Как работает факторинг</h1>
        <p style="color:#64748b;font-size:14px;margin-top:4px">Всё что нужно знать о работе с Swiss Factoring</p>
      </div>

      <!-- Main concept -->
      <div class="cl-card" style="padding:32px;margin-bottom:24px">
        <h2 style="font-size:18px;font-weight:700;color:#0f172a;margin-bottom:16px">Что такое факторинг?</h2>
        <p style="font-size:14px;color:#374151;line-height:1.7;margin-bottom:16px">
          <strong>Факторинг</strong> — это финансовый инструмент, при котором вы уступаете нам право требования по вашей дебиторской задолженности (АВР, накладные, счета-фактуры) и получаете <strong>аванс до 90% от суммы</strong> немедленно, не ожидая оплаты от покупателя (дебитора).
        </p>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px" class="grid-4">
          <div style="background:#eff6ff;border-radius:12px;padding:20px;text-align:center">
            <div style="font-size:32px;margin-bottom:8px">⚡</div>
            <div style="font-weight:700;color:#1e3a8a;font-size:15px">Быстрое финансирование</div>
            <div style="font-size:13px;color:#64748b;margin-top:6px">Деньги на счёт за 1–2 рабочих дня после подачи документов</div>
          </div>
          <div style="background:#f0fdf4;border-radius:12px;padding:20px;text-align:center">
            <div style="font-size:32px;margin-bottom:8px">🔒</div>
            <div style="font-weight:700;color:#14532d;font-size:15px">Без залога</div>
            <div style="font-size:13px;color:#64748b;margin-top:6px">Обеспечением служит сама дебиторская задолженность</div>
          </div>
          <div style="background:#fef3c7;border-radius:12px;padding:20px;text-align:center">
            <div style="font-size:32px;margin-bottom:8px">📈</div>
            <div style="font-weight:700;color:#78350f;font-size:15px">Рост бизнеса</div>
            <div style="font-size:13px;color:#64748b;margin-top:6px">Не ждите оплаты — запускайте новые проекты уже сейчас</div>
          </div>
        </div>
      </div>

      <!-- Scheme -->
      <div class="cl-card" style="padding:32px;margin-bottom:24px">
        <h2 style="font-size:18px;font-weight:700;color:#0f172a;margin-bottom:24px">Схема работы</h2>
        <div style="display:flex;gap:0;align-items:stretch;flex-wrap:wrap">
          <div v-for="(step, i) in steps" :key="i" style="flex:1;min-width:160px;display:flex;flex-direction:column;align-items:center;position:relative">
            <!-- connector -->
            <div v-if="i < steps.length-1" style="position:absolute;top:28px;left:calc(50% + 28px);right:calc(-50% + 28px);height:2px;background:linear-gradient(90deg,#dbeafe,#bfdbfe);z-index:0"></div>
            <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#1d4ed8,#3b82f6);display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:12px;position:relative;z-index:1;box-shadow:0 4px 14px rgba(37,99,235,.3)">
              {{step.icon}}
            </div>
            <div style="font-size:12px;font-weight:800;color:#1e3a8a;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Шаг {{i+1}}</div>
            <div style="font-size:13px;font-weight:700;color:#0f172a;text-align:center;margin-bottom:4px">{{step.title}}</div>
            <div style="font-size:12px;color:#64748b;text-align:center;padding:0 8px">{{step.desc}}</div>
          </div>
        </div>
      </div>

      <!-- Glossary -->
      <div class="cl-card" style="padding:32px;margin-bottom:24px">
        <h2 style="font-size:18px;font-weight:700;color:#0f172a;margin-bottom:20px">Термины и определения</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px" class="grid-2">
          <div v-for="term in terms" :key="term.name" style="padding:16px;border:1px solid #e9f0f8;border-radius:10px">
            <div style="font-size:13px;font-weight:800;color:#2563eb;margin-bottom:6px">{{term.name}}</div>
            <div style="font-size:13px;color:#374151;line-height:1.6">{{term.def}}</div>
          </div>
        </div>
      </div>

      <!-- FAQ -->
      <div class="cl-card" style="padding:32px;margin-bottom:24px">
        <h2 style="font-size:18px;font-weight:700;color:#0f172a;margin-bottom:20px">Часто задаваемые вопросы</h2>
        <div style="display:flex;flex-direction:column;gap:16px">
          <div v-for="q in faq" :key="q.q" style="border-bottom:1px solid #f1f5f9;padding-bottom:16px">
            <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:8px">❓ {{q.q}}</div>
            <div style="font-size:13px;color:#374151;line-height:1.7">{{q.a}}</div>
          </div>
        </div>
      </div>

      <!-- Contacts -->
      <div class="cl-card" style="padding:32px;background:linear-gradient(135deg,#eff6ff,#f0fdf4)">
        <h2 style="font-size:18px;font-weight:700;color:#0f172a;margin-bottom:16px">📞 Контакты и поддержка</h2>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px" class="grid-4">
          <div>
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:#64748b;margin-bottom:8px">Ваш менеджер</div>
            <div style="font-size:15px;font-weight:700;color:#0f172a">А.Муратов / Б.Ержанов</div>
            <div style="font-size:13px;color:#2563eb;margin-top:4px">+7 701 000-00-00</div>
          </div>
          <div>
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:#64748b;margin-bottom:8px">Email поддержки</div>
            <div style="font-size:15px;font-weight:700;color:#0f172a">support@swiss.kz</div>
            <div style="font-size:13px;color:#64748b;margin-top:4px">Ответ в течение 1 рабочего дня</div>
          </div>
          <div>
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:#64748b;margin-bottom:8px">Офис</div>
            <div style="font-size:15px;font-weight:700;color:#0f172a">г. Алматы</div>
            <div style="font-size:13px;color:#64748b;margin-top:4px">Пн–Пт, 09:00–18:00</div>
          </div>
        </div>
      </div>
    </div>
  `,
  data: () => ({
    steps: [
      { icon: '📄', title: 'Поставка', desc: 'Вы поставляете товар/услугу дебитору и получаете АВР' },
      { icon: '📤', title: 'Заявка', desc: 'Подаёте заявку в Swiss Factoring с документами' },
      { icon: '✅', title: 'Верификация', desc: 'Проверяем документы и дебитора (1–2 дня)' },
      { icon: '💰', title: 'Аванс', desc: 'Переводим аванс (до 90%) на ваш счёт' },
      { icon: '🏦', title: 'Оплата', desc: 'Дебитор платит нам напрямую по сроку' },
      { icon: '🔄', title: 'ВОП', desc: 'Возвращаем остаток за вычетом комиссий' },
    ],
    terms: [
      { name: 'АВР', def: 'Акт выполненных работ — первичный документ, подтверждающий выполнение обязательств поставщика перед покупателем.' },
      { name: 'Дебитор', def: 'Покупатель — компания, которая должна оплатить АВР. После уступки платёж идёт напрямую Swiss Factoring.' },
      { name: 'ОД (Основной долг)', def: 'Остаток суммы финансирования, которую ещё не погасил дебитор.' },
      { name: 'Дисконт', def: 'Доля суммы документа, которую вы получаете авансом. Пример: дисконт 85% от 10 млн = 8.5 млн.' },
      { name: 'K1 — вознаграждение', def: 'Ежедневная комиссия за пользование деньгами, начисляется в % годовых от остатка ОД.' },
      { name: 'K2 — комиссия за уступку', def: 'Разовая комиссия от суммы документа, зависит от количества дней отсрочки.' },
      { name: 'ВОП', def: 'Возвратный остаточный платёж — разница между суммой документа и суммой финансирования с комиссиями. Выплачивается вам при закрытии.' },
      { name: 'Уведомление об уступке', def: 'Письменное уведомление дебитора о передаче права требования Swiss Factoring.' },
    ],
    faq: [
      { q: 'Сколько стоит факторинг?', a: 'Стоимость складывается из K1 (вознаграждение, % годовых от ОД) и K2 (комиссия за уступку, % от суммы документа). Ставки указаны в вашем тарифном плане в разделе "Главная".' },
      { q: 'Как быстро я получу деньги?', a: 'После подачи полного пакета документов и верификации — как правило 1–2 рабочих дня. Если дебитор уже проверен и уведомление подписано — в день подачи заявки.' },
      { q: 'Что если дебитор не заплатит вовремя?', a: 'Финансирование переходит в статус "Просрочка". Начисление K1 продолжается. Наш отдел по работе с задолженностью связывается с дебитором. После 60 дней — статус "Дефолт".' },
      { q: 'Могу ли я погасить досрочно?', a: 'Да. Частично-досрочное гашение (ЧДГ) возможно в любой момент. Вы платите K1 и K2 на дату погашения, остаток идёт на уменьшение ОД.' },
      { q: 'Что такое ВОП и когда я его получу?', a: 'ВОП — это ваши деньги: разница между суммой АВР и суммой финансирования минус начисленные комиссии. Выплачивается в момент закрытия финансирования (когда ОД = 0).' },
      { q: 'Нужно ли уведомлять дебитора?', a: 'При факторинге "с уведомлением" — да, дебитор подписывает уведомление об уступке и платит напрямую нам. При факторинге "без уведомления" — дебитор не знает, платит вам, вы передаёте нам.' },
    ]
  })
};
