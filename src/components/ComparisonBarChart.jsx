import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#4F8EF7', '#3ECFA4', '#F7B84F', '#A84FF7', '#F7584F', '#4FF7D8'];

export default function ComparisonBarChart({ analyses }) {
  if (!analyses || analyses.length < 2) return null;

  const allTypes = [...new Set(
    analyses.flatMap((a) => (a.result?.types || []).map((t) => t.type_name))
  )];

  const data = allTypes.map((typeName) => {
    const row = { type_name: typeName };
    analyses.forEach((a) => {
      const type = a.result?.types?.find((t) => t.type_name === typeName);
      row[a.name] = type
        ? (typeof type.percentage_of_particle_area === 'number'
            ? type.percentage_of_particle_area
            : parseFloat(type.percentage_of_particle_area) || 0)
        : 0;
    });
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 16% 20%)" />
        <XAxis dataKey="type_name" stroke="hsl(220 12% 55%)" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={70} />
        <YAxis stroke="hsl(220 12% 55%)" tick={{ fontSize: 11 }} unit="%" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(226 20% 13%)',
            border: '1px solid hsl(225 16% 20%)',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value) => [`${value.toFixed(2)}%`, '']}
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        {analyses.map((a, idx) => (
          <Bar key={a.id} dataKey={a.name} fill={COLORS[idx % COLORS.length]} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}