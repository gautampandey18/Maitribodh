const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const CATEGORY_COLORS = {
  Visitor: '#E06D2E',
  Staff: '#2563EB',
  Vendor: '#9CA3AF',
  Contractor: '#D97706',
  Parivar: '#059669',
  Participant: '#7C3AED',
};

const PALETTE = [
  '#E06D2E',
  '#2563EB',
  '#9CA3AF',
  '#D97706',
  '#059669',
  '#7C3AED',
  '#DC2626',
  '#4B5563',
  '#0284C7',
  '#16A34A',
];

export function getCategoryColor(name, index = 0) {
  if (CATEGORY_COLORS[name]) return CATEGORY_COLORS[name];
  return PALETTE[index % PALETTE.length];
}

export function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [, m, d] = dateStr.split('-').map(Number);
  const month = MONTHS[m - 1] || '';
  return `${d} ${month}`;
}

export function getDaysList(startStr, endStr) {
  if (!startStr || !endStr) return [];
  const days = [];
  const curr = new Date(`${startStr}T00:00:00Z`);
  const end = new Date(`${endStr}T00:00:00Z`);
  while (curr <= end) {
    days.push(curr.toISOString().slice(0, 10));
    curr.setUTCDate(curr.getUTCDate() + 1);
  }
  return days;
}

export function getIstDateRange({ fromDate, toDate } = {}) {
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' });
  const todayStr = formatter.format(new Date());

  const endStr = toDate || todayStr;
  let startStr = fromDate;
  if (!startStr) {
    const endObj = new Date(`${endStr}T00:00:00Z`);
    endObj.setUTCDate(endObj.getUTCDate() - 13);
    startStr = endObj.toISOString().slice(0, 10);
  }

  const sObj = new Date(`${startStr}T00:00:00Z`);
  const eObj = new Date(`${endStr}T00:00:00Z`);
  const diffDays = Math.max(1, Math.round((eObj.getTime() - sObj.getTime()) / (86400 * 1000)) + 1);

  const prevEObj = new Date(sObj);
  prevEObj.setUTCDate(prevEObj.getUTCDate() - 1);
  const prevEndStr = prevEObj.toISOString().slice(0, 10);

  const prevSObj = new Date(prevEObj);
  prevSObj.setUTCDate(prevSObj.getUTCDate() - (diffDays - 1));
  const prevStartStr = prevSObj.toISOString().slice(0, 10);

  return {
    startStr,
    endStr,
    diffDays,
    prevStartStr,
    prevEndStr,
    isDefault: !fromDate && !toDate,
  };
}

export function formatSubtitle({ tab, startStr, endStr, isDefault, diffDays, now = new Date() }) {
  if (tab === 'occupancy') {
    const timeFormatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
    return `Live · updated ${timeFormatter.format(now)} IST`;
  }

  const startFormatted = formatDisplayDate(startStr);
  const [endY, endM, endD] = endStr.split('-').map(Number);
  const endFormatted = `${endD} ${MONTHS[endM - 1] || ''} ${endY}`;

  if (isDefault) {
    return `Last ${diffDays} days · ${startFormatted} – ${endFormatted} · times in IST`;
  }
  if (startStr === endStr) {
    return `${endFormatted} · times in IST`;
  }
  return `${startFormatted} – ${endFormatted} · times in IST`;
}

export function calculateTicks(maxValue) {
  const max = Math.max(0, Number(maxValue) || 0);
  if (max === 0) {
    return { yMax: 4, yTicks: [0, 1, 2, 3, 4] };
  }
  if (max <= 5) {
    const yMax = Math.max(4, Math.ceil(max));
    const yTicks = Array.from({ length: yMax + 1 }, (_, i) => i);
    return { yMax, yTicks };
  }
  const roughStep = max / 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalized = roughStep / magnitude;
  let stepMultiplier;
  if (normalized <= 1) stepMultiplier = 1;
  else if (normalized <= 2) stepMultiplier = 2;
  else if (normalized <= 5) stepMultiplier = 5;
  else stepMultiplier = 10;

  const step = Math.max(1, stepMultiplier * magnitude);
  const yMax = Math.ceil(max / step) * step;
  const yTicks = [];
  for (let val = 0; val <= yMax; val += step) {
    yTicks.push(val);
  }
  return { yMax, yTicks };
}

export function formatDelta(current, previous, { unit = '%', label = 'vs previous period' } = {}) {
  const curr = Number(current) || 0;
  const prev = Number(previous) || 0;
  if (prev === 0) {
    if (curr === 0) return `0${unit} ${label}`;
    return `+100${unit} ${label}`;
  }
  const pct = Math.round(((curr - prev) / prev) * 100);
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct}${unit} ${label}`;
}

export function buildVisitsAnalytics({ summary = {}, daily = [], byCategory = [], dateRange = {} }) {
  const subtitle = formatSubtitle({ tab: 'visits', ...dateRange });

  // Group daily by day and category
  const daysFromRange = getDaysList(dateRange?.startStr, dateRange?.endStr);
  const daysSet = daysFromRange.length ? daysFromRange : [...new Set(daily.map((d) => d.day))];
  const xLabels = daysSet.map((d) => {
    const [, , day] = String(d).split('-').map(Number);
    return String(day);
  });

  const catNames = [...new Set([
    ...daily.map((d) => d.category_name),
    ...byCategory.map((c) => c.category_name),
  ])].filter(Boolean);

  const series = catNames.map((cat, idx) => {
    const values = daysSet.map((day) => {
      const match = daily.find((d) => d.day === day && d.category_name === cat);
      return match ? Number(match.checkin_count) || 0 : 0;
    });
    return {
      name: cat,
      color: getCategoryColor(cat, idx),
      values,
    };
  });

  // Calculate yMax from stacked sum per day
  const maxStackedSum = Math.max(0, ...daysSet.map((_, i) => series.reduce((sum, s) => sum + (s.values[i] || 0), 0)));
  const { yMax, yTicks } = calculateTicks(maxStackedSum);

  // Segments for donut
  const total = Number(summary.current_visits) || byCategory.reduce((sum, c) => sum + (Number(c.count) || 0), 0) || 0;
  const segments = total > 0
    ? byCategory.map((c, i) => ({
      label: c.category_name,
      count: Number(c.count) || 0,
      percentage: Math.round(((Number(c.count) || 0) / total) * 100),
      color: getCategoryColor(c.category_name, i),
    }))
    : [{ label: 'No visits', count: 0, percentage: 100, color: '#E5E7EB' }];

  const durationDelta = (summary.avg_duration_min || 0) - (summary.prev_avg_duration_min || 0);
  const durationSign = durationDelta >= 0 ? '+' : '';
  const openOver24hStr = (summary.open_over_24h || 0) > 0
    ? `${summary.open_over_24h} open more than 24 h`
    : (summary.inside_now > 0 ? 'All within 24 h' : 'None inside');

  const diffDays = dateRange?.diffDays ?? 14;
  const deltaLabel = diffDays === 1 ? 'vs previous day' : `vs previous ${diffDays} days`;

  const kpis = [
    {
      label: 'Total visits',
      value: String(summary.current_visits || 0),
      delta: formatDelta(summary.current_visits, summary.prev_visits, { label: deltaLabel }),
      isTotal: true,
    },
    {
      label: 'Inside right now',
      value: String(summary.inside_now || 0),
      delta: openOver24hStr,
    },
    {
      label: 'Avg. visit duration',
      value: `${summary.avg_duration_min || 0} min`,
      delta: `${durationSign}${durationDelta} min vs previous`,
    },
    {
      label: 'Accompanying guests',
      value: String(summary.accompanying || 0),
      delta: formatDelta(summary.accompanying, summary.prev_accompanying, { label: 'vs previous' }),
    },
  ];

  return {
    subtitle,
    tableTitle: 'Visit records',
    tableCounter: `${total} records`,
    kpis,
    chartLeft: {
      type: 'stacked-bar',
      title: 'Daily check-ins by category',
      xLabels,
      yMax,
      yTicks,
      series,
    },
    chartRight: {
      type: 'donut',
      title: 'Visits by category',
      totalValue: String(total),
      totalLabel: 'visits',
      segments,
    },
  };
}

export function buildRegistrationsAnalytics({ summary = {}, daily = [], byCategory = [], dateRange = {} }) {
  const subtitle = formatSubtitle({ tab: 'registrations', ...dateRange });

  const daysSet = [...new Set(daily.map((d) => d.day))];
  const xLabels = daysSet.map((d) => {
    const [, , day] = String(d).split('-').map(Number);
    return String(day);
  });

  const catNames = [...new Set(daily.map((d) => d.category_name))];

  const series = catNames.map((cat, idx) => {
    const values = daysSet.map((day) => {
      const match = daily.find((d) => d.day === day && d.category_name === cat);
      return match ? Number(match.count) || 0 : 0;
    });
    return {
      name: cat,
      color: getCategoryColor(cat, idx),
      values,
    };
  });

  const maxStackedSum = Math.max(0, ...daysSet.map((_, i) => series.reduce((sum, s) => sum + (s.values[i] || 0), 0)));
  const { yMax, yTicks } = calculateTicks(maxStackedSum);

  const total = Number(summary.current_registrations) || byCategory.reduce((sum, c) => sum + (Number(c.count) || 0), 0) || 0;
  const segments = total > 0
    ? byCategory.map((c, i) => ({
      label: c.category_name,
      count: Number(c.count) || 0,
      percentage: Math.round(((Number(c.count) || 0) / total) * 100),
      color: getCategoryColor(c.category_name, i),
    }))
    : [{ label: 'No registrations', count: 0, percentage: 100, color: '#E5E7EB' }];

  const visitorPct = total > 0 ? Math.round(((summary.visitor_count || 0) / total) * 100) : 0;
  const pendingDelta = (summary.pending_approvals || 0) > 0
    ? `Oldest waiting ${summary.oldest_pending_days || 0} ${(summary.oldest_pending_days === 1) ? 'day' : 'days'}`
    : 'None waiting';

  const diffDays = dateRange?.diffDays ?? 14;
  const deltaLabel = diffDays === 1 ? 'vs previous day' : `vs previous ${diffDays} days`;

  const kpis = [
    {
      label: 'New registrations',
      value: String(total),
      delta: formatDelta(summary.current_registrations, summary.prev_registrations, { label: deltaLabel }),
      isTotal: true,
    },
    {
      label: 'Visitors',
      value: String(summary.visitor_count || 0),
      delta: `${visitorPct}% of new`,
    },
    {
      label: 'Vendors / Staff',
      value: `${summary.vendor_count || 0} / ${summary.staff_count || 0}`,
      delta: 'This period',
    },
    {
      label: 'Pending ID verification',
      value: String(summary.pending_approvals || 0),
      delta: pendingDelta,
    },
  ];

  return {
    subtitle,
    tableTitle: 'Registered persons',
    tableCounter: `${total} registered`,
    kpis,
    chartLeft: {
      type: 'stacked-bar',
      title: 'New registrations per day',
      xLabels,
      yMax,
      yTicks,
      series,
    },
    chartRight: {
      type: 'donut',
      title: 'Registrations by category',
      totalValue: String(total),
      totalLabel: 'new',
      segments,
    },
  };
}

export function buildOccupancyAnalytics({ summary = {}, hourly = [], byLocation = [], dateRange = {} }) {
  const subtitle = formatSubtitle({ tab: 'occupancy', ...dateRange });

  const xLabels = hourly.map((h) => {
    const hr = h.hour;
    if (hr === 12) return '12p';
    if (hr > 12) return `${hr - 12}p`;
    return `${hr}a`;
  });
  const points = hourly.map((h) => Number(h.count) || 0);
  const maxPoint = Math.max(0, ...points);
  let peakIndex = 0;
  for (let i = 0; i < points.length; i += 1) {
    if (points[i] === maxPoint) {
      peakIndex = i;
      break;
    }
  }
  const peakLabel = `Peak ${maxPoint} at ${xLabels[peakIndex] || '11a'}`;
  const { yMax, yTicks } = calculateTicks(maxPoint);

  const items = byLocation.map((loc, i) => ({
    label: loc.name,
    value: Number(loc.count) || 0,
    color: i === 0 && (Number(loc.count) || 0) > 0 ? '#B91C1C' : '#E06D2E',
  }));
  const maxLocVal = Math.max(5, ...items.map((it) => it.value));

  const fullestLoc = summary.fullest_location || (items.length ? items[0].label : 'Campus');
  const fullestDelta = summary.fullest_count ? `${summary.fullest_count} inside` : 'None inside';

  const kpis = [
    {
      label: 'On campus now',
      value: String(summary.on_campus_now || 0),
      delta: peakLabel,
    },
    {
      label: 'Fullest location',
      value: fullestLoc,
      delta: fullestDelta,
    },
    {
      label: 'Checked in today',
      value: String(summary.checked_in_today || 0),
      delta: `${summary.on_campus_now || 0} still inside`,
    },
    {
      label: 'Open > 24 h',
      value: String(summary.open_over_24h || 0),
      delta: (summary.open_over_24h || 0) > 0 ? 'Needs follow-up' : 'All within 24 h',
    },
  ];

  return {
    subtitle,
    tableTitle: 'Locations',
    tableCounter: `${items.length} locations`,
    kpis,
    chartLeft: {
      type: 'area-line',
      title: 'People on campus today',
      xLabels,
      yMax,
      yTicks,
      points,
      peakIndex,
      peakLabel,
      color: '#E06D2E',
    },
    chartRight: {
      type: 'horizontal-bar',
      title: 'Occupancy by location',
      isPercentage: false,
      maxVal: maxLocVal,
      items,
    },
  };
}

export function buildStaffAnalytics({ summary = {}, daily = [], onDutyByLocation = [], dateRange = {} }) {
  const subtitle = formatSubtitle({ tab: 'staff', ...dateRange });

  const daysSet = [...new Set(daily.map((d) => d.day))];
  const xLabels = daysSet.map((d) => {
    const [, , day] = String(d).split('-').map(Number);
    return String(day);
  });

  const activeStaff = Number(summary.active_staff) || 0;
  const presentValues = daysSet.map((day) => {
    const match = daily.find((d) => d.day === day);
    return match ? Number(match.present_count) || 0 : 0;
  });
  const absentValues = presentValues.map((p) => Math.max(0, activeStaff - p));

  const maxAttendance = Math.max(activeStaff, ...presentValues, 4);
  const { yMax, yTicks } = calculateTicks(maxAttendance);

  const series = [
    { name: 'Present', color: '#2563EB', values: presentValues },
    { name: 'Absent / off', color: '#D1D5DB', values: absentValues },
  ];

  const items = onDutyByLocation.map((loc) => ({
    label: loc.name || loc.label,
    value: Number(loc.count || loc.value) || 0,
    color: '#2563EB',
  }));
  const maxStaffLoc = Math.max(5, ...items.map((it) => it.value));

  const attendancePct = activeStaff > 0 ? Math.round(((summary.present_today || 0) / activeStaff) * 100) : 0;
  const missedDelta = (summary.missed_checkouts || 0) > 0
    ? `Open since ${summary.oldest_missed_date || 'prior days'}`
    : 'All checked out';

  const kpis = [
    {
      label: 'Active staff',
      value: String(activeStaff),
      delta: `${summary.joined_this_period || 0} joined this period`,
    },
    {
      label: 'Present today',
      value: String(summary.present_today || 0),
      delta: `${attendancePct}% attendance`,
    },
    {
      label: 'Avg. hours on site',
      value: `${(Number(summary.avg_hours) || 0).toFixed(1)} h`,
      delta: 'Completed visits',
    },
    {
      label: 'Missed checkouts',
      value: String(summary.missed_checkouts || 0),
      delta: missedDelta,
    },
  ];

  return {
    subtitle,
    tableTitle: 'Staff attendance',
    tableCounter: `${activeStaff} staff`,
    kpis,
    chartLeft: {
      type: 'stacked-bar',
      title: 'Daily attendance',
      xLabels,
      yMax,
      yTicks,
      series,
    },
    chartRight: {
      type: 'horizontal-bar',
      title: 'Staff on duty by location (today)',
      isPercentage: false,
      maxVal: maxStaffLoc,
      items,
    },
  };
}

export function buildApprovalsAnalytics({ summary = {}, daily = [], byOutcome = [], dateRange = {} }) {
  const subtitle = formatSubtitle({ tab: 'approvals', ...dateRange });

  const daysSet = [...new Set(daily.map((d) => d.day))];
  const xLabels = daysSet.map((d) => {
    const [, , day] = String(d).split('-').map(Number);
    return String(day);
  });

  const series = [
    {
      name: 'Approved',
      color: '#15803D',
      values: daysSet.map((day) => {
        const match = daily.find((d) => d.day === day);
        return match ? Number(match.approved_count) || 0 : 0;
      }),
    },
    {
      name: 'Pending',
      color: '#D97706',
      values: daysSet.map((day) => {
        const match = daily.find((d) => d.day === day);
        return match ? Number(match.pending_count) || 0 : 0;
      }),
    },
    {
      name: 'Rejected',
      color: '#B91C1C',
      values: daysSet.map((day) => {
        const match = daily.find((d) => d.day === day);
        return match ? Number(match.rejected_count) || 0 : 0;
      }),
    },
  ];

  const maxStackedSum = Math.max(0, ...daysSet.map((_, i) => series.reduce((sum, s) => sum + (s.values[i] || 0), 0)));
  const { yMax, yTicks } = calculateTicks(maxStackedSum);

  const total = Number(summary.total_requests) || byOutcome.reduce((sum, c) => sum + (Number(c.count) || 0), 0) || 0;
  const segments = total > 0
    ? byOutcome.map((c) => {
      let color = '#15803D';
      if (c.action === 'PENDING' || c.action === 'SUBMITTED') color = '#D97706';
      if (c.action === 'REJECTED') color = '#B91C1C';
      return {
        label: c.action.charAt(0).toUpperCase() + c.action.slice(1).toLowerCase(),
        count: Number(c.count) || 0,
        percentage: Math.round(((Number(c.count) || 0) / total) * 100),
        color,
      };
    })
    : [
      { label: 'Approved', count: 0, percentage: 0, color: '#15803D' },
      { label: 'Pending', count: 0, percentage: 0, color: '#D97706' },
      { label: 'Rejected', count: 0, percentage: 0, color: '#B91C1C' },
    ];

  const approvalRate = total > 0 ? Math.round(((summary.approved_count || 0) / total) * 100) : 0;
  const pendingDelta = (summary.pending_count || 0) > 0
    ? `${summary.waiting_over_1h || 0} waiting over 1 hour`
    : 'None waiting';

  const decisionTimeStr = (summary.avg_decision_min || 0) >= 60
    ? `${((summary.avg_decision_min || 0) / 60).toFixed(1)} h`
    : `${summary.avg_decision_min || 0} min`;

  const diffDays = dateRange?.diffDays ?? 14;
  const deltaLabel = diffDays === 1 ? 'vs previous day' : `vs previous ${diffDays} days`;

  const kpis = [
    {
      label: 'Approval requests',
      value: String(total),
      delta: formatDelta(summary.total_requests, summary.prev_requests, { label: deltaLabel }),
      isTotal: true,
    },
    {
      label: 'Approved',
      value: String(summary.approved_count || 0),
      delta: `${approvalRate}% approval rate`,
    },
    {
      label: 'Pending',
      value: String(summary.pending_count || 0),
      delta: pendingDelta,
    },
    {
      label: 'Median decision time',
      value: decisionTimeStr,
      delta: 'Average review time',
    },
  ];

  return {
    subtitle,
    tableTitle: 'Approval requests',
    tableCounter: `${total} requests`,
    kpis,
    chartLeft: {
      type: 'stacked-bar',
      title: 'Requests per day by outcome',
      xLabels,
      yMax,
      yTicks,
      series,
    },
    chartRight: {
      type: 'donut',
      title: 'Requests by outcome',
      totalValue: String(total),
      totalLabel: 'requests',
      segments,
    },
  };
}

export function buildBlacklistAnalytics({ summary = {}, daily = [], reasons = [], dateRange = {} }) {
  const subtitle = formatSubtitle({ tab: 'blacklist', ...dateRange });

  const daysSet = [...new Set(daily.map((d) => d.day))];
  const xLabels = daysSet.map((d) => {
    const [, , day] = String(d).split('-').map(Number);
    return String(day);
  });

  const values = daysSet.map((day) => {
    const match = daily.find((d) => d.day === day);
    return match ? Number(match.count) || 0 : 0;
  });

  const maxVal = Math.max(0, ...values);
  const { yMax, yTicks } = calculateTicks(maxVal);

  const series = [
    { name: 'Blocked', color: '#B91C1C', values },
  ];

  const items = reasons.map((r) => ({
    label: r.label,
    value: Number(r.value) || 0,
    color: '#B91C1C',
  }));
  const maxReasonVal = Math.max(5, ...items.map((it) => it.value));

  const kpis = [
    {
      label: 'On blacklist',
      value: String(summary.on_blacklist || 0),
      delta: `${summary.on_blacklist || 0} active · ${summary.expiring_soon || 0} expiring`,
      isTotal: true,
    },
    {
      label: 'Added this period',
      value: String(summary.added_this_period || 0),
      delta: 'By admin review',
    },
    {
      label: 'Blocked entry attempts',
      value: String(summary.blocked_attempts || 0),
      delta: (summary.blocked_attempts || 0) > 0 ? `${summary.blocked_attempts} at gate` : 'None this period',
    },
    {
      label: 'Gate screenings',
      value: String(summary.gate_screenings || 0),
      delta: '100% screened',
    },
  ];

  return {
    subtitle,
    tableTitle: 'Blacklisted persons',
    tableCounter: `${summary.on_blacklist || 0} blacklisted`,
    kpis,
    chartLeft: {
      type: 'stacked-bar',
      title: 'Blocked entry attempts per day',
      xLabels,
      yMax,
      yTicks,
      series,
    },
    chartRight: {
      type: 'horizontal-bar',
      title: 'Reasons for blacklisting',
      isPercentage: false,
      maxVal: maxReasonVal,
      items,
    },
  };
}
