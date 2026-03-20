'use strict';

function getVATRate(dateStr) {
  return new Date(dateStr) >= new Date('2026-01-01') ? 0.16 : 0.12;
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function daysBetween(dateA, dateB) {
  return Math.max(0, Math.floor((new Date(dateB) - new Date(dateA)) / 86400000));
}

function daysForK1(dateFinancing, calcDate) {
  const start = new Date(dateFinancing);
  start.setDate(start.getDate() + 1);
  return Math.max(0, Math.floor((new Date(calcDate) - start) / 86400000));
}

function daysForK2(dateFinancing, calcDate) {
  return daysBetween(dateFinancing, calcDate);
}

function calculateK1(od, k1Rate, days, calcDate) {
  if (days <= 0) return { net: 0, vat: 0, gross: 0, vatRate: getVATRate(calcDate) };
  const net = round2((od * k1Rate / 365) * days);
  const vatRate = getVATRate(calcDate);
  const vat = round2(net * vatRate);
  return { net, vat, gross: round2(net + vat), vatRate };
}

function getK2Rate(tp, cumulativeDays, inclusive = false) {
  if (!tp.k2_rate_0_30 && tp.k2_rate_0_30 !== 0) return 0;
  if (tp.k2_rate_0_30 === null) return 0;
  const d = cumulativeDays;
  const less = inclusive ? (t) => d <= t : (t) => d < t;
  if (less(30))  return tp.k2_rate_0_30  || 0;
  if (less(60))  return tp.k2_rate_30_60 || 0;
  if (less(90))  return tp.k2_rate_60_90 || 0;
  if (less(120)) return tp.k2_rate_90_120 || 0;
  return tp.k2_rate_120plus || 0;
}

function calculateK2Increment(documentSum, tp, cumulativeDays, previousK2Net, calcDate, inclusive = false) {
  if (tp.series === 'F1') return { net: 0, vat: 0, gross: 0, totalNet: previousK2Net || 0 };
  const rate = getK2Rate(tp, cumulativeDays, inclusive);
  if (!rate) return { net: 0, vat: 0, gross: 0, totalNet: previousK2Net || 0 };

  const totalNet = round2(documentSum * rate / 100);
  const net = round2(Math.max(0, totalNet - (previousK2Net || 0)));
  const vatRate = getVATRate(calcDate);
  const vat = round2(net * vatRate);
  return { net, vat, gross: round2(net + vat), totalNet };
}

function calculateK3(documentSum, k3Rate, days, calcDate) {
  if (!k3Rate) return { net: 0, vat: 0, gross: 0 };
  const net = round2(documentSum * k3Rate / 100 * days);
  const vatRate = getVATRate(calcDate);
  const vat = round2(net * vatRate);
  return { net, vat, gross: round2(net + vat) };
}

function calculateVOP({ document_sum, financing_sum, k1_accrued_net, k2_accrued_net, k3_accrued_net = 0 }) {
  return round2(document_sum - financing_sum - (k1_accrued_net || 0) - (k2_accrued_net || 0) - (k3_accrued_net || 0));
}

function applyPaymentPriority(paymentAmount, k1Gross, k2Gross, currentOD) {
  const totalComm = round2(k1Gross + k2Gross);
  let remaining = paymentAmount;
  let k1Paid = 0, k2Paid = 0, odReduction = 0;

  if (remaining >= totalComm) {
    k1Paid = k1Gross;
    k2Paid = k2Gross;
    remaining = round2(remaining - totalComm);
    odReduction = round2(Math.min(remaining, currentOD));
  } else if (remaining >= k1Gross) {
    k1Paid = k1Gross;
    k2Paid = round2(remaining - k1Paid);
  } else {
    k1Paid = remaining;
  }

  const odAfter = round2(Math.max(0, currentOD - odReduction));
  const overpayment = round2(Math.max(0, remaining - currentOD));
  return { k1Paid, k2Paid, k3Paid: 0, odReduction, odAfter, overpayment };
}

function previewCalculation(financing, tp, calcDate, inclusive = false) {
  if (!financing.date_financing) return null;

  const k1Days = daysForK1(financing.date_financing, calcDate);
  const k2Days = daysForK2(financing.date_financing, calcDate);

  const k1 = calculateK1(financing.current_od || financing.financing_sum, tp.k1_rate, k1Days, calcDate);
  const k2 = calculateK2Increment(
    financing.document_sum, tp, k2Days,
    financing.k2_accrued_net || 0, calcDate, inclusive
  );

  const k1TotalNet = round2((financing.k1_accrued_net || 0) + k1.net);
  const k2TotalNet = round2((financing.k2_accrued_net || 0) + k2.net);

  const vop = calculateVOP({
    document_sum: financing.document_sum,
    financing_sum: financing.financing_sum,
    k1_accrued_net: k1TotalNet,
    k2_accrued_net: k2TotalNet,
  });

  return {
    calcDate, k1Days, k2Days,
    k1, k2, vop,
    vatRate: getVATRate(calcDate),
    totalGross: round2(k1.gross + k2.gross),
    k1TotalNet, k2TotalNet,
  };
}

module.exports = {
  getVATRate, round2, daysBetween,
  daysForK1, daysForK2,
  calculateK1, getK2Rate, calculateK2Increment,
  calculateK3, calculateVOP,
  applyPaymentPriority, previewCalculation,
};
