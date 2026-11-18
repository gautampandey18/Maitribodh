import { Box, Typography } from '@mui/material';

export const REPORT_TABS_CONFIG = {
  visits: {
    subtitle: 'Times in IST',
    tableTitle: 'Visit records',
    tableCounter: '0 records',
    kpis: [
      { label: 'Total visits', value: '0', delta: '0% vs previous period', isTotal: true },
      { label: 'People Inside Premises', value: '0', delta: '0 Present for More Than 24 Hours' },
      { label: 'Accompanying guests', value: '0' },
    ],
    chartLeft: {
      type: 'stacked-bar',
      title: 'Daily check-ins by category',
      xLabels: [],
      yMax: 4,
      yTicks: [0, 1, 2, 3, 4],
      series: [],
    },
    chartRight: {
      type: 'donut',
      title: 'Visits by category',
      totalValue: '0',
      totalLabel: 'visits',
      segments: [
        { label: 'No visits', count: 0, percentage: 100, color: '#E5E7EB' },
      ],
    },
  },
  registrations: {
    subtitle: 'Times in IST',
    tableTitle: 'Registered persons',
    tableCounter: '0 records',
    kpis: [
      { label: 'New registrations', value: '0', delta: '0% vs previous period', isTotal: true },
      { label: 'Visitors', value: '0', delta: '0% of new' },
      { label: 'Vendors / Staff', value: '0 / 0', delta: 'This period' },
      { label: 'Pending approvals', value: '0' },
    ],
    chartLeft: {
      type: 'stacked-bar',
      title: 'New registrations per day',
      xLabels: [],
      yMax: 4,
      yTicks: [0, 1, 2, 3, 4],
      series: [],
    },
    chartRight: {
      type: 'donut',
      title: 'Registrations by category',
      totalValue: '0',
      totalLabel: 'new',
      segments: [
        { label: 'No registrations', count: 0, percentage: 100, color: '#E5E7EB' },
      ],
    },
  },
  occupancy: {
    subtitle: 'Live · times in IST',
    tableTitle: 'Locations',
    tableCounter: '0 locations',
    kpis: [
      { label: 'Currently Inside', value: '0', delta: 'Nobody on campus today' },
      { label: 'Most Occupied Location', value: 'None', delta: 'No Occupancy Recorded' },
      { label: 'Checked In Today', value: '0', delta: "0 of Today's Check-ins Still Inside" },
    ],
    chartLeft: {
      type: 'area-line',
      title: 'People on campus today',
      xLabels: [],
      yMax: 4,
      yTicks: [0, 1, 2, 3, 4],
      points: [],
      peakIndex: 0,
      peakLabel: 'Nobody on campus today',
      color: '#E06D2E',
    },
    chartRight: {
      type: 'horizontal-bar',
      title: 'Occupancy by location (now)',
      isPercentage: false,
      items: [],
    },
  },
  staff: {
    subtitle: 'Times in IST',
    tableTitle: 'Staff',
    tableCounter: '0 records',
    kpis: [
      {
        label: 'Active staff',
        value: '0',
        lines: [{ label: 'Active staff', value: '0' }, { label: 'New Staff Registered', value: '0' }],
      },
      {
        label: 'Present today',
        value: '0',
        lines: [{ label: 'Present today', value: '0' }, { label: 'Attendance', value: '0%' }],
      },
      {
        label: 'Average Visit Duration',
        value: '0 h',
        lines: [{ label: 'Average Visit Duration', value: '0 h' }, { label: 'Staff Visits Completed', value: '0' }],
      },
      {
        label: 'Missed checkouts',
        value: '0',
        lines: [{ label: 'Missed checkouts (over 12 h)', value: '0' }, { label: 'Checked out today', value: '0' }],
      },
    ],
    chartLeft: {
      type: 'stacked-bar',
      title: 'Daily attendance',
      xLabels: [],
      yMax: 4,
      yTicks: [0, 1, 2, 3, 4],
      series: [],
    },
    chartRight: {
      type: 'horizontal-bar',
      title: 'Staff on duty by location (today)',
      isPercentage: false,
      maxVal: 4,
      items: [],
    },
  },
  approvals: {
    subtitle: 'Times in IST',
    tableTitle: 'Approval activity',
    tableCounter: '0 records',
    kpis: [
      {
        label: 'Approval requests',
        value: '0',
        lines: [{ label: 'Approval requests', value: '0' }, { label: 'Change vs previous period', value: '0%' }],
        isTotal: true,
      },
      {
        label: 'Approved request',
        value: '0',
        lines: [{ label: 'Approved request', value: '0' }, { label: 'Approval rate', value: '—' }],
      },
      { label: 'Pending request', value: '0' },
    ],
    chartLeft: {
      type: 'stacked-bar',
      title: 'Approval activity per day',
      xLabels: [],
      yMax: 4,
      yTicks: [0, 1, 2, 3, 4],
      series: [],
    },
    chartRight: {
      type: 'donut',
      title: 'Activity by outcome',
      totalValue: '0',
      totalLabel: 'actions',
      segments: [
        { label: 'No activity', count: 0, percentage: 100, color: '#E5E7EB' },
      ],
    },
  },
  blacklist: {
    subtitle: 'Times in IST',
    tableTitle: 'Blacklisted persons',
    tableCounter: '0 records',
    kpis: [
      {
        label: 'Currently blacklisted',
        value: '0',
        lines: [{ label: 'Currently blacklisted', value: '0' }, { label: 'Expiring in 7 days', value: '0' }],
        isTotal: true,
      },
      {
        label: 'New Blacklisted Persons',
        value: '0',
        lines: [{ label: 'New Blacklisted Persons', value: '0' }, { label: 'Blacklist Removed', value: '0' }],
      },
      { label: 'Blocked entry attempts', value: '0' },
    ],
    chartLeft: {
      type: 'stacked-bar',
      title: 'Blocked entry attempts per day',
      xLabels: [],
      yMax: 4,
      yTicks: [0, 1, 2, 3, 4],
      series: [],
    },
    chartRight: {
      type: 'horizontal-bar',
      title: 'Reasons for blacklisting',
      isPercentage: false,
      maxVal: 4,
      items: [],
    },
  },
};

const kpiColors = [
  ['#4F46E5', '#EEF2FF', '#C7D2FE'],
  ['#E17324', '#FFF6EF', '#F6D5BA'],
  ['#C98A0B', '#FFF9EA', '#F1DFAC'],
  ['#2E9E6B', '#F0FAF5', '#C3E7D4'],
];

export function KpiGrid({ kpis }) {
  if (!kpis || !kpis.length) return null;
  return (
    <Box className="reports-kpi-grid" aria-label="Key Performance Indicators" style={{ '--report-kpi-columns': Math.min(kpis.length, 4) }}>
      {kpis.map((kpi, index) => (
        <Box key={kpi.label} className="reports-kpi-card" style={{
          '--report-kpi-accent': kpiColors[index % kpiColors.length][0],
          '--report-kpi-background': kpiColors[index % kpiColors.length][1],
          '--report-kpi-border': kpiColors[index % kpiColors.length][2],
        }}>
          <Box className="reports-kpi-lines">
            {(kpi.lines || [kpi]).map((line) => (
              <Box key={line.label} className="reports-kpi-line">
                <Typography className="reports-kpi-label">{line.label}<span>:</span></Typography>
                <Typography className="reports-kpi-line-value">{line.value}</Typography>
              </Box>
            ))}
            {!kpi.lines && kpi.delta && <Typography className="reports-kpi-delta">{kpi.delta}</Typography>}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export function StackedBarChart({ chart }) {
  const { title, xLabels = [], series = [], yMax = 4, yTicks = [0, 1, 2, 3, 4] } = chart;
  const width = 540;
  const height = 220;
  const margin = { left: 36, right: 16, top: 20, bottom: 28 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const slotWidth = xLabels.length ? plotWidth / xLabels.length : plotWidth;
  const barWidth = Math.max(2, Math.min(18, Math.floor(slotWidth * 0.65)));
  const labelStep = xLabels.length > 31 ? 5 : (xLabels.length > 18 ? 2 : 1);
  const safeYMax = yMax > 0 ? yMax : 1;

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
      {xLabels.length === 0 || series.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">No data available for this period</Typography>
        </Box>
      ) : (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label={title}
      >
        {/* Y Axis Gridlines and Labels */}
        {yTicks.map((tick) => {
          const y = margin.top + plotHeight - (tick / safeYMax) * plotHeight;
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
          const showLabel = i % labelStep === 0 || i === xLabels.length - 1;
          return (
            <g key={`${label}-${i}`}>
              {series.map((s) => {
                const val = s.values?.[i] || 0;
                const segH = (val / safeYMax) * plotHeight;
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
              {showLabel && (
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
              )}
            </g>
          );
        })}
      </svg>
      )}
    </Box>
  );
}

export function DonutChart({ chart }) {
  const { title, totalValue = '0', totalLabel = 'records', segments = [] } = chart;
  const radius = 60;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;
  const safeSegments = segments.length
    ? segments
    : [{ label: 'No records', count: 0, percentage: 100, color: '#E5E7EB' }];

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
            {safeSegments.map((seg) => {
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
          {safeSegments.map((seg) => (
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
  const { title, xLabels = [], yMax = 4, yTicks = [0, 1, 2, 3, 4], points = [], peakIndex = 0, peakLabel = '', color = '#E06D2E' } = chart;
  const width = 540;
  const height = 220;
  const margin = { left: 36, right: 24, top: 28, bottom: 28 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const safeLabels = xLabels.length ? xLabels : [];
  const safePoints = points.length ? points : safeLabels.map(() => 0);
  const slotWidth = safeLabels.length > 1 ? plotWidth / (safeLabels.length - 1) : plotWidth;
  const safeYMax = yMax > 0 ? yMax : 1;

  const coords = safePoints.map((p, i) => ({
    x: margin.left + i * slotWidth,
    y: margin.top + plotHeight - (p / safeYMax) * plotHeight,
  }));

  const linePath = coords.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = coords[i - 1];
    const cpX = (prev.x + pt.x) / 2;
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${pt.y}, ${pt.x} ${pt.y}`;
  }, '');

  const areaPath = coords.length
    ? `${linePath} L ${coords[coords.length - 1].x} ${margin.top + plotHeight} L ${coords[0].x} ${margin.top + plotHeight} Z`
    : '';
  const peakPt = coords[peakIndex] || coords[0];

  return (
    <Box className="reports-chart-card">
      <Box className="reports-chart-header">
        <Typography className="reports-chart-title">{title}</Typography>
      </Box>
      {safeLabels.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">No activity recorded for today</Typography>
        </Box>
      ) : (
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
          const y = margin.top + plotHeight - (tick / safeYMax) * plotHeight;
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
        {safeLabels.map((label, i) => (
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
      )}
    </Box>
  );
}

export function HorizontalBarChart({ chart }) {
  const { title, items = [], isPercentage, maxVal = 100 } = chart;
  const safeMax = maxVal > 0 ? maxVal : 1;

  return (
    <Box className="reports-chart-card">
      <Box className="reports-chart-header">
        <Typography className="reports-chart-title">{title}</Typography>
      </Box>
      <Box className="horizontal-bar-chart">
        {items.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">No data available for this period</Typography>
          </Box>
        ) : (
        items.map((item) => {
          const pct = isPercentage ? item.value : (item.value / safeMax) * 100;
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
        }))}
      </Box>
    </Box>
  );
}

export function ReportChartsSection({ selectedKey, liveConfig, loading }) {
  const fallback = REPORT_TABS_CONFIG[selectedKey] || REPORT_TABS_CONFIG.visits;
  const config = liveConfig || fallback;
  const { kpis, chartLeft, chartRight } = config;

  return (
    <Box sx={{ mb: 1.5, opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s ease-in-out' }}>
      <KpiGrid kpis={kpis} />
      <Box className="reports-charts-grid">
        {chartLeft?.type === 'stacked-bar' && <StackedBarChart chart={chartLeft} />}
        {chartLeft?.type === 'area-line' && <AreaLineChart chart={chartLeft} />}

        {chartRight?.type === 'donut' && <DonutChart chart={chartRight} />}
        {chartRight?.type === 'horizontal-bar' && <HorizontalBarChart chart={chartRight} />}
      </Box>
    </Box>
  );
}
