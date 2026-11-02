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
    todayStr,
    diffDays,
    prevStartStr,
    prevEndStr,
    isDefault: !fromDate && !toDate,
  };
}

/**
 * Builds a zero-filled day axis for daily charts so days without activity still render.
 * @param {Array<{day: string}>} daily Rows returned by a daily aggregate query.
 * @param {{startStr?: string, endStr?: string}} dateRange Selected IST date range.
 * @returns {{days: string[], xLabels: string[]}} ISO day keys and day-of-month labels.
 */
export function buildDayAxis(daily = [], dateRange = {}) {
  const rangeDays = getDaysList(dateRange?.startStr, dateRange?.endStr);
  const days = rangeDays.length ? rangeDays : [...new Set(daily.map((d) => d.day))];
  const xLabels = days.map((d) => String(Number(String(d).split('-')[2])));
  return { days, xLabels };
}

/**
 * Assigns one color per category so stacked bars and donut segments always agree.
 * @param {string[]} names Category names in display order.
 * @returns {Map<string, string>} Category name to color.
 */
export function buildCategoryColorMap(names = []) {
  return new Map(names.map((name, index) => [name, getCategoryColor(name, index)]));
}

function periodDeltaLabel(dateRange) {
  const diffDays = dateRange?.diffDays ?? 14;
  return diffDays === 1 ? 'vs previous day' : `vs previous ${diffDays} days`;
}

function formatHourLabel(hour) {
  if (hour === 0) return '12a';
  if (hour === 12) return '12p';
  return hour > 12 ? `${hour - 12}p` : `${hour}a`;
}

function formatFullDate(dateStr) {
  const [year, month, day] = String(dateStr).split('-').map(Number);
  return `${day} ${MONTHS[month - 1] || ''} ${year}`;
}

export function formatSubtitle({ tab, startStr, endStr, todayStr, isDefault, diffDays, now = new Date() }) {
  if (tab === 'occupancy' && (!todayStr || endStr === todayStr)) {
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
  if (tab === 'occupancy') {
    return `${formatFullDate(endStr)} · times in IST`;
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

/**
 * Shapes Visit History analytics rows into KPI cards and chart configs.
 * @param {object} input Summary, daily, and per-category rows plus the selected date range.
 * @returns {object} Analytics payload for the Visit History tab.
 */
export function buildVisitsAnalytics({ summary = {}, daily = [], byCategory = [], dateRange = {} }) {
  const subtitle = formatSubtitle({ tab: 'visits', ...dateRange });
  const { days, xLabels } = buildDayAxis(daily, dateRange);

  const catNames = [...new Set([
    ...byCategory.map((c) => c.category_name),
    ...daily.map((d) => d.category_name),
  ])].filter(Boolean);
  const colors = buildCategoryColorMap(catNames);

  const series = catNames.map((cat) => ({
    name: cat,
    color: colors.get(cat),
    values: days.map((day) => {
      const match = daily.find((d) => d.day === day && d.category_name === cat);
      return match ? Number(match.checkin_count) || 0 : 0;
    }),
  }));

  const maxStackedSum = Math.max(0, ...days.map((_, i) => series.reduce((sum, s) => sum + (s.values[i] || 0), 0)));
  const { yMax, yTicks } = calculateTicks(maxStackedSum);

  const total = Number(summary.current_visits) || 0;
  const segments = total > 0
    ? byCategory.map((c) => ({
      label: c.category_name,
      count: Number(c.count) || 0,
      percentage: Math.round(((Number(c.count) || 0) / total) * 100),
      color: colors.get(c.category_name),
    }))
    : [{ label: 'No visits', count: 0, percentage: 100, color: '#E5E7EB' }];

  const durationDelta = (Number(summary.avg_duration_min) || 0) - (Number(summary.prev_avg_duration_min) || 0);
  const durationSign = durationDelta >= 0 ? '+' : '';
  const openOver24hStr = (summary.open_over_24h || 0) > 0
    ? `${summary.open_over_24h} open more than 24 h`
    : (summary.inside_now > 0 ? 'All within 24 h' : 'None inside');

  const kpis = [
    {
      label: 'Total visits',
      value: String(total),
      delta: formatDelta(summary.current_visits, summary.prev_visits, { label: periodDeltaLabel(dateRange) }),
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

/**
 * Shapes Person Registrations analytics rows into KPI cards and chart configs.
 * @param {object} input Summary, daily, and per-category rows plus the selected date range.
 * @returns {object} Analytics payload for the Person Registrations tab.
 */
export function buildRegistrationsAnalytics({ summary = {}, daily = [], byCategory = [], dateRange = {} }) {
  const subtitle = formatSubtitle({ tab: 'registrations', ...dateRange });
  const { days, xLabels } = buildDayAxis(daily, dateRange);

  const catNames = [...new Set([
    ...byCategory.map((c) => c.category_name),
    ...daily.map((d) => d.category_name),
  ])].filter(Boolean);
  const colors = buildCategoryColorMap(catNames);

  const series = catNames.map((cat) => ({
    name: cat,
    color: colors.get(cat),
    values: days.map((day) => {
      const match = daily.find((d) => d.day === day && d.category_name === cat);
      return match ? Number(match.count) || 0 : 0;
    }),
  }));

  const maxStackedSum = Math.max(0, ...days.map((_, i) => series.reduce((sum, s) => sum + (s.values[i] || 0), 0)));
  const { yMax, yTicks } = calculateTicks(maxStackedSum);

  const total = Number(summary.current_registrations) || 0;
  const segments = total > 0
    ? byCategory.map((c) => ({
      label: c.category_name,
      count: Number(c.count) || 0,
      percentage: Math.round(((Number(c.count) || 0) / total) * 100),
      color: colors.get(c.category_name),
    }))
    : [{ label: 'No registrations', count: 0, percentage: 100, color: '#E5E7EB' }];

  const visitorPct = total > 0 ? Math.round(((summary.visitor_count || 0) / total) * 100) : 0;
  const oldestDays = Number(summary.oldest_pending_days) || 0;
  const pendingDelta = (summary.pending_approvals || 0) > 0
    ? `Oldest waiting ${oldestDays} ${oldestDays === 1 ? 'day' : 'days'}`
    : 'None waiting';

  const kpis = [
    {
      label: 'New registrations',
      value: String(total),
      delta: formatDelta(summary.current_registrations, summary.prev_registrations, { label: periodDeltaLabel(dateRange) }),
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
      label: 'Pending approvals',
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

/**
 * Shapes Occupancy analytics rows for the selected day (live when the day is today).
 * @param {object} input Summary, hourly, and per-location rows plus the selected date range.
 * @returns {object} Analytics payload for the Occupancy tab.
 */
export function buildOccupancyAnalytics({ summary = {}, hourly = [], byLocation = [], dateRange = {} }) {
  const subtitle = formatSubtitle({ tab: 'occupancy', ...dateRange });
  const isToday = !dateRange?.todayStr || dateRange.endStr === dateRange.todayStr;
  const dayLabel = isToday ? 'today' : `on ${formatDisplayDate(dateRange.endStr)}`;

  const xLabels = hourly.map((h) => formatHourLabel(Number(h.hour)));
  const points = hourly.map((h) => Number(h.count) || 0);
  const maxPoint = Math.max(0, ...points);
  const peakIndex = Math.max(0, points.indexOf(maxPoint));
  const peakLabel = maxPoint > 0 ? `Peak ${maxPoint} at ${xLabels[peakIndex]}` : `Nobody on campus ${dayLabel}`;
  const { yMax, yTicks } = calculateTicks(maxPoint);

  const items = byLocation.map((loc, i) => ({
    label: loc.name,
    value: Number(loc.count) || 0,
    color: i === 0 && (Number(loc.count) || 0) > 0 ? '#B91C1C' : '#E06D2E',
  }));
  const maxLocVal = Math.max(5, ...items.map((it) => it.value));
  const fullest = items[0]?.value > 0 ? items[0] : null;

  const kpis = [
    {
      label: 'On campus now',
      value: String(summary.on_campus_now || 0),
      delta: peakLabel,
    },
    {
      label: isToday ? 'Fullest location' : 'Busiest location',
      value: fullest ? fullest.label : 'None',
      delta: fullest ? `${fullest.value} ${isToday ? 'inside' : 'checked in'}` : 'No activity',
    },
    {
      label: `Checked in ${dayLabel}`,
      value: String(summary.checked_in_day || 0),
      delta: `${summary.still_inside_from_day || 0} still inside`,
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
      title: isToday ? 'People on campus today' : `People on campus · ${formatFullDate(dateRange.endStr)}`,
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
      title: isToday ? 'Occupancy by location (now)' : 'Check-ins by location',
      isPercentage: false,
      maxVal: maxLocVal,
      items,
    },
  };
}

/**
 * Shapes Staff analytics rows into attendance KPIs and charts.
 * @param {object} input Summary, daily attendance, and on-duty rows plus the selected date range.
 * @returns {object} Analytics payload for the Staff tab.
 */
export function buildStaffAnalytics({ summary = {}, daily = [], onDutyByLocation = [], dateRange = {} }) {
  const subtitle = formatSubtitle({ tab: 'staff', ...dateRange });
  const { days, xLabels } = buildDayAxis(daily, dateRange);

  const activeStaff = Number(summary.active_staff) || 0;
  const presentValues = days.map((day) => {
    const match = daily.find((d) => d.day === day);
    return match ? Number(match.present_count) || 0 : 0;
  });
  const absentValues = presentValues.map((p) => Math.max(0, activeStaff - p));

  const maxAttendance = Math.max(activeStaff, ...presentValues);
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
      delta: `${summary.joined_this_period || 0} registered this period`,
    },
    {
      label: 'Present today',
      value: String(summary.present_today || 0),
      delta: `${attendancePct}% attendance`,
    },
    {
      label: 'Avg. hours on site',
      value: `${(Number(summary.avg_hours) || 0).toFixed(1)} h`,
      delta: `${summary.completed_visits || 0} completed visits`,
    },
    {
      label: 'Missed checkouts',
      value: String(summary.missed_checkouts || 0),
      delta: missedDelta,
    },
  ];

  return {
    subtitle,
    tableTitle: 'Staff',
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

const APPROVAL_ACTION_STYLES = {
  SUBMITTED: { label: 'Submitted', color: '#D97706' },
  RESUBMITTED: { label: 'Resubmitted', color: '#F59E0B' },
  APPROVED: { label: 'Approved', color: '#15803D' },
  REJECTED: { label: 'Rejected', color: '#B91C1C' },
};

/**
 * Shapes Approvals analytics rows. Requests are submissions; the approval rate uses decisions only.
 * @param {object} input Summary, daily, and per-action rows plus the selected date range.
 * @returns {object} Analytics payload for the Approvals tab.
 */
export function buildApprovalsAnalytics({ summary = {}, daily = [], byOutcome = [], dateRange = {} }) {
  const subtitle = formatSubtitle({ tab: 'approvals', ...dateRange });
  const { days, xLabels } = buildDayAxis(daily, dateRange);

  const dailyValues = (field) => days.map((day) => {
    const match = daily.find((d) => d.day === day);
    return match ? Number(match[field]) || 0 : 0;
  });
  const series = [
    { name: 'Approved', color: APPROVAL_ACTION_STYLES.APPROVED.color, values: dailyValues('approved_count') },
    { name: 'Submitted', color: APPROVAL_ACTION_STYLES.SUBMITTED.color, values: dailyValues('submitted_count') },
    { name: 'Rejected', color: APPROVAL_ACTION_STYLES.REJECTED.color, values: dailyValues('rejected_count') },
  ];

  const maxStackedSum = Math.max(0, ...days.map((_, i) => series.reduce((sum, s) => sum + (s.values[i] || 0), 0)));
  const { yMax, yTicks } = calculateTicks(maxStackedSum);

  const totalActions = byOutcome.reduce((sum, c) => sum + (Number(c.count) || 0), 0);
  const segments = totalActions > 0
    ? byOutcome.map((c) => {
      const style = APPROVAL_ACTION_STYLES[c.action] || { label: c.action, color: '#4B5563' };
      return {
        label: style.label,
        count: Number(c.count) || 0,
        percentage: Math.round(((Number(c.count) || 0) / totalActions) * 100),
        color: style.color,
      };
    })
    : [{ label: 'No activity', count: 0, percentage: 100, color: '#E5E7EB' }];

  const approved = Number(summary.approved_count) || 0;
  const decisions = approved + (Number(summary.rejected_count) || 0);
  const approvalRate = decisions > 0 ? Math.round((approved / decisions) * 100) : 0;
  const pendingDelta = (summary.pending_count || 0) > 0
    ? `${summary.waiting_over_1h || 0} waiting over 1 hour`
    : 'None waiting';

  const avgDecisionMin = Number(summary.avg_decision_min) || 0;
  const decisionTimeStr = avgDecisionMin >= 60
    ? `${(avgDecisionMin / 60).toFixed(1)} h`
    : `${avgDecisionMin} min`;

  const kpis = [
    {
      label: 'Approval requests',
      value: String(summary.total_requests || 0),
      delta: formatDelta(summary.total_requests, summary.prev_requests, { label: periodDeltaLabel(dateRange) }),
      isTotal: true,
    },
    {
      label: 'Approved',
      value: String(approved),
      delta: decisions > 0 ? `${approvalRate}% approval rate` : 'No decisions yet',
    },
    {
      label: 'Pending',
      value: String(summary.pending_count || 0),
      delta: pendingDelta,
    },
    {
      label: 'Avg. decision time',
      value: decisions > 0 ? decisionTimeStr : '—',
      delta: `${decisions} ${decisions === 1 ? 'decision' : 'decisions'} this period`,
    },
  ];

  return {
    subtitle,
    tableTitle: 'Approval activity',
    tableCounter: `${totalActions} actions`,
    kpis,
    chartLeft: {
      type: 'stacked-bar',
      title: 'Approval activity per day',
      xLabels,
      yMax,
      yTicks,
      series,
    },
    chartRight: {
      type: 'donut',
      title: 'Activity by outcome',
      totalValue: String(totalActions),
      totalLabel: 'actions',
      segments,
    },
  };
}

/**
 * Shapes Blacklist analytics rows into KPI cards and chart configs.
 * @param {object} input Summary, daily blocked attempts, and reason rows plus the selected date range.
 * @returns {object} Analytics payload for the Blacklist tab.
 */
export function buildBlacklistAnalytics({ summary = {}, daily = [], reasons = [], dateRange = {} }) {
  const subtitle = formatSubtitle({ tab: 'blacklist', ...dateRange });
  const { days, xLabels } = buildDayAxis(daily, dateRange);

  const values = days.map((day) => {
    const match = daily.find((d) => d.day === day);
    return match ? Number(match.count) || 0 : 0;
  });
  const { yMax, yTicks } = calculateTicks(Math.max(0, ...values));

  const items = reasons.map((r) => ({
    label: r.label,
    value: Number(r.value) || 0,
    color: '#B91C1C',
  }));
  const maxReasonVal = Math.max(5, ...items.map((it) => it.value));

  const blocked = Number(summary.blocked_attempts) || 0;
  const screenings = Number(summary.gate_screenings) || 0;
  const blockedPct = screenings > 0 ? Math.round((blocked / screenings) * 100) : 0;

  const kpis = [
    {
      label: 'On blacklist',
      value: String(summary.on_blacklist || 0),
      delta: `${summary.expiring_soon || 0} expiring in 7 days`,
      isTotal: true,
    },
    {
      label: 'Added this period',
      value: String(summary.added_this_period || 0),
      delta: `${summary.lifted_this_period || 0} lifted this period`,
    },
    {
      label: 'Blocked entry attempts',
      value: String(blocked),
      delta: blocked > 0 ? `${blockedPct}% of gate screenings` : 'None this period',
    },
    {
      label: 'Gate screenings',
      value: String(screenings),
      delta: screenings > 0 ? `${screenings - blocked} not blocked` : 'None this period',
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
      series: [{ name: 'Blocked', color: '#B91C1C', values }],
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
