import { Box, Typography } from '@mui/material';

export const REPORT_TABS_CONFIG = {
  visits: {
    subtitle: 'Last 14 days · 14 Oct – 27 Oct 2026 · times in IST',
    tableTitle: 'Visit records',
    tableCounter: '5 of 291 · newest first',
    kpis: [
      { label: 'Total visits', value: '291', delta: '+12% vs previous 14 days', isTotal: true },
      { label: 'Inside right now', value: '2', delta: 'Both open more than 24 h' },
      { label: 'Avg. visit duration', value: '38 min', delta: '-4 min vs previous' },
      { label: 'Accompanying guests', value: '64', delta: '+9% vs previous' },
    ],
    chartLeft: {
      type: 'stacked-bar',
      title: 'Daily check-ins by category',
      xLabels: ['14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27'],
      yMax: 32,
      yTicks: [0, 4, 8, 12, 16, 20, 24, 28, 32],
      series: [
        { name: 'Visitor', color: '#E06D2E', values: [12, 9, 14, 11, 16, 18, 10, 13, 15, 12, 17, 19, 14, 8] },
        { name: 'Staff', color: '#2563EB', values: [6, 6, 5, 6, 6, 2, 1, 6, 6, 5, 6, 6, 2, 5] },
        { name: 'Vendor', color: '#9CA3AF', values: [3, 2, 4, 3, 2, 1, 0, 3, 4, 2, 3, 5, 1, 2] },
      ],
    },
    chartRight: {
      type: 'donut',
      title: 'Visits by category',
      totalValue: '291',
      totalLabel: 'visits',
      segments: [
        { label: 'Visitor', count: 188, percentage: 65, color: '#E06D2E' },
        { label: 'Staff', count: 68, percentage: 23, color: '#2563EB' },
        { label: 'Vendor', count: 35, percentage: 12, color: '#9CA3AF' },
      ],
    },
  },
  registrations: {
    subtitle: 'Last 14 days · 14 Oct – 27 Oct 2026 · times in IST',
    tableTitle: 'Registered persons',
    tableCounter: '4 of 41',
    kpis: [
      { label: 'New registrations', value: '41', delta: '+17% vs previous 14 days', isTotal: true },
      { label: 'Visitors', value: '29', delta: '71% of new' },
      { label: 'Vendors / Staff', value: '8 / 4', delta: 'This period' },
      { label: 'Pending ID verification', value: '3', delta: 'Oldest waiting 2 days' },
    ],
    chartLeft: {
      type: 'stacked-bar',
      title: 'New registrations per day',
      xLabels: ['14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27'],
      yMax: 5,
      yTicks: [0, 1, 2, 3, 4, 5],
      series: [
        { name: 'Visitor', color: '#E06D2E', values: [2, 1, 3, 2, 3, 1, 0, 2, 3, 2, 3, 4, 2, 1] },
        { name: 'Staff', color: '#2563EB', values: [0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1] },
        { name: 'Vendor', color: '#9CA3AF', values: [1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0] },
      ],
    },
    chartRight: {
      type: 'donut',
      title: 'Registrations by category',
      totalValue: '41',
      totalLabel: 'new',
      segments: [
        { label: 'Visitor', count: 29, percentage: 71, color: '#E06D2E' },
        { label: 'Vendor', count: 8, percentage: 20, color: '#9CA3AF' },
        { label: 'Staff', count: 4, percentage: 10, color: '#2563EB' },
      ],
    },
  },
  occupancy: {
    subtitle: 'Live · updated 27 Oct 2026, 3:17 PM IST',
    tableTitle: 'Locations',
    tableCounter: '4 locations',
    kpis: [
      { label: 'On campus now', value: '48', delta: 'Peak today 48 at 11 AM' },
      { label: 'Fullest location', value: 'Goushala', delta: '84% of capacity' },
      { label: 'Checked in today', value: '114', delta: '+6% vs usual Tuesday' },
      { label: 'Open > 24 h', value: '2', delta: 'Needs follow-up' },
    ],
    chartLeft: {
      type: 'area-line',
      title: 'People on campus today',
      xLabels: ['6a', '7a', '8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p'],
      yMax: 60,
      yTicks: [0, 10, 20, 30, 40, 50, 60],
      points: [6, 10, 20, 32, 42, 48, 42, 38, 40, 35],
      peakIndex: 5,
      peakLabel: 'Peak 48 at 11a',
      color: '#E06D2E',
    },
    chartRight: {
      type: 'horizontal-bar',
      title: 'Occupancy by location (% full)',
      isPercentage: true,
      items: [
        { label: 'Goushala', value: 84, color: '#B91C1C' },
        { label: 'Admin Office', value: 45, color: '#E06D2E' },
        { label: 'Hostel', value: 10, color: '#E06D2E' },
        { label: 'Gurukul', value: 10, color: '#E06D2E' },
      ],
    },
  },
  staff: {
    subtitle: 'Last 14 days · 14 Oct – 27 Oct 2026 · times in IST',
    tableTitle: 'Staff attendance',
    tableCounter: '5 of 12',
    kpis: [
      { label: 'Active staff', value: '12', delta: '1 joined this period' },
      { label: 'Present today', value: '11', delta: '92% attendance' },
      { label: 'Avg. hours on site', value: '7.6 h', delta: '+0.3 h vs previous' },
      { label: 'Missed checkouts', value: '1', delta: 'Open since 21 Oct' },
    ],
    chartLeft: {
      type: 'stacked-bar',
      title: 'Daily attendance',
      xLabels: ['14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27'],
      yMax: 12,
      yTicks: [0, 2, 4, 6, 8, 10, 12],
      series: [
        { name: 'Present', color: '#2563EB', values: [11, 12, 10, 11, 12, 6, 4, 11, 12, 10, 11, 12, 6, 11] },
        { name: 'Absent / off', color: '#D1D5DB', values: [1, 0, 2, 1, 0, 6, 8, 1, 0, 2, 1, 0, 6, 1] },
      ],
    },
    chartRight: {
      type: 'horizontal-bar',
      title: 'Staff on duty by location (today)',
      isPercentage: false,
      maxVal: 6,
      items: [
        { label: 'Goushala', value: 5, color: '#2563EB' },
        { label: 'Admin Office', value: 3, color: '#2563EB' },
        { label: 'Gurukul', value: 2, color: '#2563EB' },
        { label: 'Hostel', value: 1, color: '#2563EB' },
      ],
    },
  },
  approvals: {
    subtitle: 'Last 14 days · 14 Oct – 27 Oct 2026 · times in IST',
    tableTitle: 'Approval requests',
    tableCounter: 'newest first',
    kpis: [
      { label: 'Approval requests', value: '47', delta: '+8% vs previous 14 days', isTotal: true },
      { label: 'Approved', value: '38', delta: '81% approval rate' },
      { label: 'Pending', value: '6', delta: '2 waiting over 1 hour' },
      { label: 'Median decision time', value: '14 min', delta: '-5 min vs previous' },
    ],
    chartLeft: {
      type: 'stacked-bar',
      title: 'Requests per day by outcome',
      xLabels: ['14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27'],
      yMax: 6,
      yTicks: [0, 1, 2, 3, 4, 5, 6],
      series: [
        { name: 'Approved', color: '#15803D', values: [3, 2, 4, 2, 3, 2, 1, 3, 4, 2, 3, 5, 2, 2] },
        { name: 'Pending', color: '#D97706', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 3] },
        { name: 'Rejected', color: '#B91C1C', values: [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0] },
      ],
    },
    chartRight: {
      type: 'donut',
      title: 'Requests by outcome',
      totalValue: '47',
      totalLabel: 'requests',
      segments: [
        { label: 'Approved', count: 38, percentage: 81, color: '#15803D' },
        { label: 'Pending', count: 6, percentage: 13, color: '#D97706' },
        { label: 'Rejected', count: 3, percentage: 6, color: '#B91C1C' },
      ],
    },
  },
  blacklist: {
    subtitle: 'Last 14 days · 14 Oct – 27 Oct 2026 · times in IST',
    tableTitle: 'Blacklisted persons',
    tableCounter: '5 of 7 · mobile numbers masked',
    kpis: [
      { label: 'On blacklist', value: '7', delta: '6 active · 1 expiring', isTotal: true },
      { label: 'Added this period', value: '2', delta: 'By admin review' },
      { label: 'Blocked entry attempts', value: '3', delta: '2 at Main Gate' },
      { label: 'Gate screenings', value: '291', delta: '100% screened' },
    ],
    chartLeft: {
      type: 'stacked-bar',
      title: 'Blocked entry attempts per day',
      xLabels: ['14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27'],
      yMax: 3,
      yTicks: [0, 1, 2, 3],
      series: [
        { name: 'Blocked', color: '#B91C1C', values: [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0] },
      ],
    },
    chartRight: {
      type: 'horizontal-bar',
      title: 'Reasons for blacklisting',
      isPercentage: false,
      maxVal: 3.5,
      items: [
        { label: 'Misconduct on campus', value: 3, color: '#B91C1C' },
        { label: 'Unauthorised entry', value: 2, color: '#B91C1C' },
        { label: 'Vendor contract ended', value: 1, color: '#B91C1C' },
        { label: 'Other', value: 1, color: '#B91C1C' },
      ],
    },
  },
};

export function KpiGrid({ kpis }) {
  if (!kpis || !kpis.length) return null;
  return (
    <Box className="reports-kpi-grid" aria-label="Key Performance Indicators">
      {kpis.map((kpi) => (
        <Box key={kpi.label} className="reports-kpi-card">
          <Typography className="reports-kpi-label">{kpi.label}</Typography>
          <Typography className="reports-kpi-value">{kpi.value}</Typography>
          <Typography className="reports-kpi-delta">{kpi.delta}</Typography>
        </Box>
      ))}
    </Box>
  );
}

export function StackedBarChart({ chart }) {
  const { title, xLabels, series, yMax, yTicks } = chart;
  const width = 540;
  const height = 220;
  const margin = { left: 36, right: 16, top: 20, bottom: 28 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const slotWidth = plotWidth / xLabels.length;
  const barWidth = 16;

  return (
    <Box className="reports-chart-card">
      <Box className="reports-chart-header">
        <Typography className="reports-chart-title">{title}</Typography>
        <Box className="chart-legend-row">
          {series.map((s) => (
            <Box key={s.name} className="chart-legend-chip">
              <Box className="chart-legend-box" sx={{ bgcolor: s.color }} />
              <span>{s.name}</span>
            </Box>
          ))}
        </Box>
      </Box>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label={title}
      >
        {/* Y Axis Gridlines and Labels */}
        {yTicks.map((tick) => {
          const y = margin.top + plotHeight - (tick / yMax) * plotHeight;
          return (
            <g key={tick}>
              <line
                x1={margin.left}
                y1={y}
                x2={width - margin.right}
                y2={y}
                stroke="#F3F4F6"
                strokeWidth="1"
              />
              <text
                x={margin.left - 8}
                y={y + 3.5}
                textAnchor="end"
                fontSize="10"
                fill="#9CA3AF"
                fontFamily="inherit"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Stacked Bars per X Label */}
        {xLabels.map((label, i) => {
          const barX = margin.left + i * slotWidth + (slotWidth - barWidth) / 2;
          let accHeight = 0;
          return (
            <g key={label}>
              {series.map((s) => {
                const val = s.values[i] || 0;
                const segH = (val / yMax) * plotHeight;
                const segY = margin.top + plotHeight - accHeight - segH;
                accHeight += segH;
                if (segH <= 0) return null;
                return (
                  <rect
                    key={s.name}
                    x={barX}
                    y={segY}
                    width={barWidth}
                    height={segH}
                    fill={s.color}
                  />
                );
              })}
              <text
                x={barX + barWidth / 2}
                y={height - 8}
                textAnchor="middle"
                fontSize="10"
                fill="#6B7280"
                fontFamily="inherit"
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </Box>
  );
}

export function DonutChart({ chart }) {
  const { title, totalValue, totalLabel, segments } = chart;
  const radius = 60;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <Box className="reports-chart-card">
      <Box className="reports-chart-header">
        <Typography className="reports-chart-title">{title}</Typography>
      </Box>
      <Box className="reports-donut-container">
        <svg
          viewBox="0 0 160 160"
          style={{ width: 160, height: 160, flexShrink: 0 }}
          role="img"
          aria-label={title}
        >
          <g transform="rotate(-90 80 80)">
            {segments.map((seg) => {
              const dashLength = (seg.percentage / 100) * circumference;
              const dashOffset = -(accumulatedPercent / 100) * circumference;
              accumulatedPercent += seg.percentage;
              return (
                <circle
                  key={seg.label}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${Math.max(0, dashLength - 1.5)} ${circumference}`}
                  strokeDashoffset={dashOffset}
                />
              );
            })}
          </g>
          <text
            x="80"
            y="76"
            textAnchor="middle"
            fontSize="22"
            fontWeight="700"
            fill="#111827"
            fontFamily="inherit"
          >
            {totalValue}
          </text>
          <text
            x="80"
            y="94"
            textAnchor="middle"
            fontSize="12"
            fill="#6B7280"
            fontFamily="inherit"
          >
            {totalLabel}
          </text>
        </svg>

        <Box className="chart-legend-list">
          {segments.map((seg) => (
            <Box key={seg.label} className="chart-legend-item">
              <Box className="legend-dot" sx={{ bgcolor: seg.color }} />
              <Typography component="span" className="legend-label">{seg.label}</Typography>
              <Typography component="span" className="legend-value">{seg.count} ({seg.percentage}%)</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export function AreaLineChart({ chart }) {
  const { title, xLabels, yMax, yTicks, points, peakIndex, peakLabel, color } = chart;
  const width = 540;
  const height = 220;
  const margin = { left: 36, right: 24, top: 28, bottom: 28 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const slotWidth = plotWidth / (xLabels.length - 1);

  const coords = points.map((p, i) => ({
    x: margin.left + i * slotWidth,
    y: margin.top + plotHeight - (p / yMax) * plotHeight,
  }));

  const linePath = coords.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = coords[i - 1];
    const cpX = (prev.x + pt.x) / 2;
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${pt.y}, ${pt.x} ${pt.y}`;
  }, '');

  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${margin.top + plotHeight} L ${coords[0].x} ${margin.top + plotHeight} Z`;
  const peakPt = coords[peakIndex];

  return (
    <Box className="reports-chart-card">
      <Box className="reports-chart-header">
        <Typography className="reports-chart-title">{title}</Typography>
      </Box>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label={title}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Y Axis Gridlines and Labels */}
        {yTicks.map((tick) => {
          const y = margin.top + plotHeight - (tick / yMax) * plotHeight;
          return (
            <g key={tick}>
              <line
                x1={margin.left}
                y1={y}
                x2={width - margin.right}
                y2={y}
                stroke="#F3F4F6"
                strokeWidth="1"
              />
              <text
                x={margin.left - 8}
                y={y + 3.5}
                textAnchor="end"
                fontSize="10"
                fill="#9CA3AF"
                fontFamily="inherit"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGradient)" />

        {/* Smooth line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" />

        {/* Peak point badge */}
        {peakPt && (
          <g>
            <circle cx={peakPt.x} cy={peakPt.y} r="4" fill={color} />
            <text
              x={peakPt.x}
              y={peakPt.y - 10}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fill="#111827"
              fontFamily="inherit"
            >
              {peakLabel}
            </text>
          </g>
        )}

        {/* X labels */}
        {xLabels.map((label, i) => (
          <text
            key={label}
            x={margin.left + i * slotWidth}
            y={height - 8}
            textAnchor="middle"
            fontSize="10"
            fill="#6B7280"
            fontFamily="inherit"
          >
            {label}
          </text>
        ))}
      </svg>
    </Box>
  );
}

export function HorizontalBarChart({ chart }) {
  const { title, items, isPercentage, maxVal = 100 } = chart;

  return (
    <Box className="reports-chart-card">
      <Box className="reports-chart-header">
        <Typography className="reports-chart-title">{title}</Typography>
      </Box>
      <Box className="horizontal-bar-chart">
        {items.map((item) => {
          const pct = isPercentage ? item.value : (item.value / maxVal) * 100;
          return (
            <Box key={item.label} className="hbar-row">
              <Typography component="span" className="hbar-label">{item.label}</Typography>
              <Box className="hbar-track">
                <Box
                  className="hbar-fill"
                  sx={{ width: `${Math.min(100, Math.max(3, pct))}%`, bgcolor: item.color }}
                />
              </Box>
              <Typography component="span" className="hbar-value">
                {isPercentage ? `${item.value}%` : item.value}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export function ReportChartsSection({ selectedKey }) {
  const config = REPORT_TABS_CONFIG[selectedKey] || REPORT_TABS_CONFIG.visits;
  const { kpis, chartLeft, chartRight } = config;

  return (
    <Box sx={{ mb: 3 }}>
      <KpiGrid kpis={kpis} />
      <Box className="reports-charts-grid">
        {chartLeft.type === 'stacked-bar' && <StackedBarChart chart={chartLeft} />}
        {chartLeft.type === 'area-line' && <AreaLineChart chart={chartLeft} />}

        {chartRight.type === 'donut' && <DonutChart chart={chartRight} />}
        {chartRight.type === 'horizontal-bar' && <HorizontalBarChart chart={chartRight} />}
      </Box>
    </Box>
  );
}

