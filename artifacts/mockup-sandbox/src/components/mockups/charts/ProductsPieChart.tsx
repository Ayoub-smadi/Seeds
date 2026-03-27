import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { nameAr: "محاصيل صيفية", nameEn: "Summer Crops", value: 57, color: "#f97316" },
  { nameAr: "محاصيل شتوية", nameEn: "Winter Crops", value: 35, color: "#3b82f6" },
  { nameAr: "زينة شتوية", nameEn: "Winter Ornamentals", value: 13, color: "#8b5cf6" },
  { nameAr: "زينة صيفية", nameEn: "Summer Ornamentals", value: 6, color: "#10b981" },
  { nameAr: "بذور للإستنبات", nameEn: "Seeds for Sprouting", value: 5, color: "#ec4899" },
];

const total = data.reduce((s, d) => s + d.value, 0);

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div
        style={{
          background: "rgba(15,15,25,0.95)",
          border: `2px solid ${d.color}`,
          borderRadius: 14,
          padding: "12px 18px",
          boxShadow: `0 0 20px ${d.color}55`,
          fontFamily: "inherit",
          direction: "rtl",
        }}
      >
        <p style={{ color: d.color, fontWeight: 700, fontSize: 16, margin: 0 }}>
          {d.nameAr}
        </p>
        <p style={{ color: "#ccc", fontSize: 13, margin: "2px 0 0" }}>
          {d.nameEn}
        </p>
        <p style={{ color: "#fff", fontWeight: 700, fontSize: 22, margin: "6px 0 0" }}>
          {d.value}{" "}
          <span style={{ fontSize: 13, fontWeight: 400, color: "#aaa" }}>منتج</span>
        </p>
        <p style={{ color: d.color, fontSize: 15, margin: "2px 0 0" }}>
          {((d.value / total) * 100).toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.05) return null;
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      style={{ fontSize: 13, fontWeight: 700, textShadow: "0 1px 4px #0008" }}
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

export function ProductsPieChart() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0f1a 0%, #1a1040 50%, #0d1a2e 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
        fontFamily: "'Cairo', 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 8, direction: "rtl" }}>
        <h1
          style={{
            color: "#fff",
            fontSize: 26,
            fontWeight: 800,
            margin: 0,
            letterSpacing: "-0.5px",
          }}
        >
          🌱 توزيع منتجات بذور زراعية
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 14, marginTop: 6 }}>
          إجمالي {total} منتج موزعة على 5 تصنيفات
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: 480, height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={72}
              outerRadius={130}
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
              label={renderCustomLabel}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.nameAr}
                  fill={entry.color}
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.45}
                  style={{
                    filter:
                      activeIndex === index
                        ? `drop-shadow(0 0 12px ${entry.color}99)`
                        : "none",
                    transition: "opacity 0.2s, filter 0.2s",
                    cursor: "pointer",
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px 20px",
          width: "100%",
          maxWidth: 460,
          marginTop: 4,
          direction: "rtl",
        }}
      >
        {data.map((entry, index) => (
          <div
            key={entry.nameAr}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background:
                activeIndex === index
                  ? `${entry.color}22`
                  : "rgba(255,255,255,0.05)",
              border: `1px solid ${activeIndex === index ? entry.color + "88" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 12,
              padding: "10px 14px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: entry.color,
                flexShrink: 0,
                boxShadow: `0 0 8px ${entry.color}99`,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  margin: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {entry.nameAr}
              </p>
              <p style={{ color: "#94a3b8", fontSize: 11, margin: "1px 0 0" }}>
                {entry.value} منتج
              </p>
            </div>
            <span
              style={{
                color: entry.color,
                fontWeight: 700,
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {((entry.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
        <div
          style={{
            gridColumn: "span 2",
            background: "rgba(255,255,255,0.03)",
            border: "1px dashed rgba(255,255,255,0.12)",
            borderRadius: 12,
            padding: "10px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ color: "#64748b", fontSize: 13 }}>المجموع الكلي</span>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>
            {total} منتج
          </span>
        </div>
      </div>
    </div>
  );
}
