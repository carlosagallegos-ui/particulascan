import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#4F8EF7', '#3ECFA4', '#F7B84F', '#A84FF7', '#F7584F', '#4FF7D8', '#F74FB8', '#B8F74F'];

export default function ParticlePieChart({ result }) {
  if (!result?.types?.length) return null;

  const data = result.types.map((t) => ({
    name: t.type_name,
    value: typeof t.percentage_of_particle_area === 'number'
      ? t.percentage_of_particle_area
      : parseFloat(t.percentage_of_particle_area) || 0,
    count: t.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          innerRadius={50}
          paddingAngle={2}
        >
          {data.map((_, idx) => (
            <Cell key={idx} fill={COLORS[idx % COLORS.length]} stroke="hsl(var(--card))" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(226 20% 13%)',
            border: '1px solid hsl(225 16% 20%)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value, name, props) => [`${value.toFixed(2)}%`, name]}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px' }}
          formatter={(value) => <span style={{ color: 'hsl(210 20% 92%)' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}