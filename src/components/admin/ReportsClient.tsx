'use client'

import { motion } from 'framer-motion'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from 'recharts'

interface ReportsClientProps {
  leadsChartData: any[]
  eventCounts: Record<string, number>
  topChurchesData: any[]
  isChurchAdmin: boolean
}

export default function ReportsClient({ 
  leadsChartData, eventCounts, topChurchesData, isChurchAdmin 
}: ReportsClientProps) {

  // Prepare Funnel Data
  const funnelData = [
    { name: 'Acessos', value: eventCounts['PageView'] || 0, fill: 'var(--gray-300)' },
    { name: 'Igrejas Encontradas', value: eventCounts['ChurchMatched'] || 0, fill: 'var(--gray-400)' },
    { name: 'Início Form', value: eventCounts['LeadFormStarted'] || 0, fill: 'var(--gray-600)' },
    { name: 'Leads Gerados', value: eventCounts['LeadCompleted'] || 0, fill: 'var(--red)' },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 
          className="text-heading-2"
          style={{ fontFamily: 'var(--font-serif)', color: 'var(--gray-900)' }}
        >
          Relatórios & Métricas
        </h1>
        <p className="text-small" style={{ color: 'var(--gray-500)' }}>
          Acompanhe o desempenho do funil de captação
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads Over Time Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-soft p-6 flex flex-col gap-4 lg:col-span-2"
        >
          <h2 className="text-heading-3" style={{ color: 'var(--gray-900)' }}>
            Leads nos últimos 30 dias
          </h2>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer>
              <AreaChart data={leadsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--red)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--red)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--gray-200)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--gray-500)', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--gray-500)', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: 'var(--gray-900)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  name="Leads"
                  stroke="var(--red)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorLeads)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Funnel Conversion Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-soft p-6 flex flex-col gap-4"
        >
          <h2 className="text-heading-3" style={{ color: 'var(--gray-900)' }}>
            Funil de Conversão
          </h2>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer>
              <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--gray-200)" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'var(--gray-700)', fontSize: 13, fontWeight: 500 }}
                  width={120}
                />
                <Tooltip 
                  cursor={{ fill: 'var(--gray-100)' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" name="Quantidade" radius={[0, 4, 4, 0]} barSize={32}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Churches Chart */}
        {!isChurchAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-soft p-6 flex flex-col gap-4"
          >
            <h2 className="text-heading-3" style={{ color: 'var(--gray-900)' }}>
              Top 5 Igrejas (Leads)
            </h2>
            <div style={{ height: 300, width: '100%' }}>
              <ResponsiveContainer>
                <BarChart data={topChurchesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--gray-200)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--gray-500)', fontSize: 11 }}
                    tickFormatter={(value) => value.replace('IASD ', '')}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--gray-500)', fontSize: 12 }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'var(--gray-100)' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="leads" name="Leads" fill="var(--gray-800)" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
