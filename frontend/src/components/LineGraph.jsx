import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

// Custom tooltip to show clearer labels
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc', borderRadius: 4 }}>
        <p><strong>{new Date(label).toLocaleDateString()}</strong></p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color, margin: '4px 0' }}>
            {entry.name}: <strong>{entry.value.toFixed(2)}{entry.dataKey === 'value' ? '' : '%'}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const LineGraph = ({ data, type = 'value' }) => {
  // 🔹 Mode 1: "value" → single line (total portfolio value)
  if (type === 'value') {
    return (
      <div style={{ marginTop: 30 }}>
        <h2>💰 Total Portfolio Value Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid stroke="#eee" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(str) => new Date(str).toLocaleDateString()}
            />
            <YAxis 
              domain={['auto', 'auto']}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              name="Portfolio Value"
              stroke="#8884d8"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // 🔹 Mode 2: "weight" → multiple lines (company weight evolution)
  if (type === 'weight') {
    // data is an object: { "Company A": [{date, weight}, ...], ... }
    // Convert to array of points: [{ date, "Company A": 12.89, "Company B": 8.72, ... }, ...]
    const dates = Array.from(
      new Set(
        Object.values(data)
          .flat()
          .map(d => d.date)
          .sort((a, b) => new Date(a) - new Date(b))
      )
    );

    const chartData = dates.map(date => {
      const point = { date };
      Object.entries(data).forEach(([company, points]) => {
        const match = points.find(p => p.date === date);
        point[company] = match ? match.weight : null;
      });
      return point;
    });

    // Get top 10 companies by max weight (to avoid clutter)
    const companyMaxWeights = Object.entries(data).map(([company, points]) => ({
      company,
      max: Math.max(...points.map(p => p.weight))
    })).sort((a, b) => b.max - a.max);

    const topCompanies = companyMaxWeights.slice(0, 10).map(c => c.company);
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BACC6', '#F79646'
    ];

    return (
      <div style={{ marginTop: 30 }}>
        <h2>⚖️ Company Weight Evolution Over Time</h2>
        <p style={{ fontSize: '0.9em', color: '#666' }}>
          Showing top {topCompanies.length} companies by peak weight
        </p>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid stroke="#eee" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(str) => new Date(str).toLocaleDateString()}
            />
            {/* CHANGED: domain from [0, 100] to [0, 15] */}
            <YAxis
              domain={[0, 15]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {topCompanies.map((company, i) => (
              <Line
                key={company}
                type="monotone"
                dataKey={company}
                name={company}
                stroke={colors[i % colors.length]}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls={false} // don't connect across missing dates
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
};

export default LineGraph;