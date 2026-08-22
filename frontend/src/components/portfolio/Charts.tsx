import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReactNode } from "react";

import { Panel } from "@/components/ui/arbx";

/* ================================================================
   SHARED STYLES
   ================================================================ */

const axis = {
  stroke: "var(--color-subtle)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  contentStyle: {
    borderRadius: 8,
    border: "1px solid var(--color-border)",
    fontSize: 12,
    background: "var(--color-card)",
    color: "var(--color-foreground)",
  },
};

const grid = <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />;

/*
 * Fixed chart dimensions are intentional here.
 *
 * This avoids ResponsiveContainer sizing issues inside the
 * CSS grid used by Portfolio.tsx.
 *
 * The cards are wide enough for this chart size in the desktop
 * layout used by the hackathon demo.
 */
const CHART_WIDTH = 620;
const CHART_HEIGHT = 180;

/* ================================================================
   CHART CARD
   ================================================================ */

export function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Panel className="min-w-0 overflow-hidden p-4">
      <h3 className="text-[13px] font-semibold">{title}</h3>

      <div className="portfolio-chart-container mt-3 w-full overflow-hidden">{children}</div>
    </Panel>
  );
}

/* ================================================================
   REVENUE CHART
   ================================================================ */

export function RevenueChart({
  data,
}: {
  data: {
    label: string;
    revenue: number;
  }[];
}) {
  return (
    <AreaChart
      width={CHART_WIDTH}
      height={CHART_HEIGHT}
      data={data}
      margin={{
        left: 0,
        right: 12,
        top: 8,
        bottom: 0,
      }}
    >
      <defs>
        <linearGradient id="portfolio-revenue-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-brand)" stopOpacity={0.25} />

          <stop offset="100%" stopColor="var(--color-brand)" stopOpacity={0} />
        </linearGradient>
      </defs>

      {grid}

      <XAxis dataKey="label" {...axis} />

      <YAxis {...axis} tickFormatter={(value) => Number(value).toFixed(2)} />

      <Tooltip
        {...tooltipStyle}
        formatter={(value) => [`${Number(value ?? 0).toFixed(4)} ETH`, "Revenue"]}
      />

      <Area
        type="monotone"
        dataKey="revenue"
        stroke="var(--color-brand)"
        strokeWidth={2}
        fill="url(#portfolio-revenue-gradient)"
        dot={false}
        activeDot={{
          r: 4,
        }}
      />
    </AreaChart>
  );
}

/* ================================================================
   USER / SUBSCRIPTION GROWTH
   ================================================================ */

export function GrowthChart({
  data,
}: {
  data: {
    label: string;
    users: number;
    subscriptions: number;
  }[];
}) {
  return (
    <LineChart
      width={CHART_WIDTH}
      height={CHART_HEIGHT}
      data={data}
      margin={{
        left: 0,
        right: 12,
        top: 8,
        bottom: 0,
      }}
    >
      {grid}

      <XAxis dataKey="label" {...axis} />

      <YAxis {...axis} />

      <Tooltip {...tooltipStyle} />

      <Line
        type="monotone"
        dataKey="users"
        stroke="var(--color-indigo)"
        strokeWidth={2}
        dot={false}
        activeDot={{
          r: 4,
        }}
        name="Users"
      />

      <Line
        type="monotone"
        dataKey="subscriptions"
        stroke="var(--color-brand)"
        strokeWidth={2}
        dot={false}
        activeDot={{
          r: 4,
        }}
        name="Subscriptions"
      />
    </LineChart>
  );
}

/* ================================================================
   SIMPLE BAR
   ================================================================ */

export function SimpleBar({
  data,
  dataKey = "value",
  color = "var(--color-brand)",
}: {
  data: {
    label: string;
    [key: string]: string | number;
  }[];

  dataKey?: string;

  color?: string;
}) {
  /*
   * Don't try to render an empty Recharts dataset.
   */
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-[12px] text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <BarChart
      width={CHART_WIDTH}
      height={CHART_HEIGHT}
      data={data}
      margin={{
        left: 0,
        right: 12,
        top: 8,
        bottom: 0,
      }}
    >
      {grid}

      <XAxis dataKey="label" {...axis} />

      <YAxis {...axis} />

      <Tooltip
        {...tooltipStyle}
        cursor={{
          fill: "var(--color-surface)",
        }}
      />

      <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} barSize={24} />
    </BarChart>
  );
}

/* ================================================================
   TOKEN USAGE
   ================================================================ */

export function TokenChart({
  data,
}: {
  data: {
    label: string;
    tokens: number;
  }[];
}) {
  return (
    <AreaChart
      width={CHART_WIDTH}
      height={CHART_HEIGHT}
      data={data}
      margin={{
        left: 0,
        right: 12,
        top: 8,
        bottom: 0,
      }}
    >
      <defs>
        <linearGradient id="portfolio-token-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-indigo)" stopOpacity={0.22} />

          <stop offset="100%" stopColor="var(--color-indigo)" stopOpacity={0} />
        </linearGradient>
      </defs>

      {grid}

      <XAxis dataKey="label" {...axis} />

      <YAxis {...axis} tickFormatter={(value) => Number(value).toLocaleString()} />

      <Tooltip
        {...tooltipStyle}
        formatter={(value) => [Number(value ?? 0).toLocaleString(), "Tokens"]}
      />

      <Area
        type="monotone"
        dataKey="tokens"
        stroke="var(--color-indigo)"
        strokeWidth={2}
        fill="url(#portfolio-token-gradient)"
        dot={false}
        activeDot={{
          r: 4,
        }}
      />
    </AreaChart>
  );
}

/* ================================================================
   MONTHLY / YEARLY SUBSCRIPTIONS
   ================================================================ */

const pieColors = ["var(--color-brand)", "var(--color-indigo)", "var(--color-subtle)"];

export function SplitPie({
  data,
}: {
  data: {
    label: string;
    value: number;
  }[];
}) {
  const hasData = data && data.some((item) => Number(item.value) > 0);

  /*
   * If there are no subscriptions, show a clean empty state.
   */
  if (!hasData) {
    return (
      <div className="flex h-full items-center justify-center text-[12px] text-muted-foreground">
        No subscription data yet
      </div>
    );
  }

  return (
    <PieChart width={CHART_WIDTH} height={CHART_HEIGHT}>
      <Tooltip {...tooltipStyle} />

      <Pie
        data={data}
        dataKey="value"
        nameKey="label"
        cx="50%"
        cy="50%"
        innerRadius={44}
        outerRadius={68}
        paddingAngle={2}
        stroke="none"
      >
        {data.map((_, index) => (
          <Cell key={`subscription-cell-${index}`} fill={pieColors[index % pieColors.length]} />
        ))}
      </Pie>
    </PieChart>
  );
}
