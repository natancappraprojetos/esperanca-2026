'use client'

import { motion } from 'framer-motion'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, LabelList
} from 'recharts'

interface ReportsClientProps {
  leadsChartData: any[]
  eventCounts: Record<string, number>
  allChurchesData: any[]
  isChurchAdmin: boolean
  period: string
}

export default function ReportsClient({ 
  leadsChartData, eventCounts, allChurchesData, isChurchAdmin, period 
}: ReportsClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', e.target.value)
    router.push(`${pathname}?${params.toString()}`)
  }

  // Prepare Funnel Data
  const funnelData = [
    { name: 'Acessos ao site', value: eventCounts['PageView'] || 0, fill: 'var(--gray-300)' },
    { name: 'Leads Gerados', value: eventCounts['LeadCompleted'] || 0, fill: 'var(--gray-400)' },
    { name: 'Downloads do Banner', value: eventCounts['InviteSaved'] || 0, fill: 'var(--gray-600)' },
    { name: 'Downloads do PDF', value: eventCounts['DownloadCompleted'] || 0, fill: 'var(--red)' },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 
            className="text-heading-2"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--gray-900)' }}
          >
            Relatórios & Métricas
          </h1>
          <p className="text-small" style={{ color: 'var(--gray-500)' }}>
            Acompanhe o desempenho do funil de captação
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Período:</label>
          <select 
            className="form-input bg-white w-auto"
            value={period}
            onChange={handlePeriodChange}
          >
            <option value="today">Hoje</option>
            <option value="yesterday">Ontem</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="all">Todo o período</option>
          </select>
        </div>
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
            Evolução de Leads (Últimos 30 dias)
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
            className="card-soft p-6 flex flex-col gap-4 lg:col-span-2"
          >
            <h2 className="text-heading-3" style={{ color: 'var(--gray-900)' }}>
              Igrejas
            </h2>
            <div style={{ height: Math.max(300, allChurchesData.length * 60), width: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
              <ResponsiveContainer>
                <BarChart data={allChurchesData} layout="vertical" margin={{ top: 10, right: 40, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--gray-200)" />
                  <XAxis type="number" xAxisId="leads" hide />
                  <XAxis type="number" xAxisId="pageViews" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--gray-500)', fontSize: 11 }}
                    tickFormatter={(value) => value.replace('IASD ', '')}
                    width={150}
                  />
                  <Tooltip 
                    cursor={{ fill: 'var(--gray-100)' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="leads" name="Leads" xAxisId="leads" fill="var(--gray-800)" radius={[0, 4, 4, 0]} barSize={16}>
                     <LabelList dataKey="leads" position="right" fill="var(--gray-700)" fontSize={11} fontWeight={600} />
                  </Bar>
                  <Bar dataKey="pageViews" name="Acessos ao site" xAxisId="pageViews" fill="var(--gray-400)" radius={[0, 4, 4, 0]} barSize={16}>
                     <LabelList dataKey="pageViews" position="right" fill="var(--gray-500)" fontSize={11} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* All Churches List */}
        {!isChurchAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card-soft p-6 flex flex-col gap-4 lg:col-span-2"
          >
            <h2 className="text-heading-3" style={{ color: 'var(--gray-900)' }}>
              Todas as Igrejas
            </h2>
            
            {allChurchesData.length === 0 ? (
              <p className="text-gray-500 py-4">Nenhuma igreja encontrada neste período.</p>
            ) : (
              <div className="overflow-x-auto mt-2 max-h-[400px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-gray-200">
                      <th className="pb-3 text-sm font-semibold text-gray-700">Igreja</th>
                      <th className="pb-3 text-sm font-semibold text-gray-700 text-right w-32">Acessos ao site</th>
                      <th className="pb-3 text-sm font-semibold text-gray-700 text-right w-32">Total de Leads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allChurchesData.map((church, idx) => (
                      <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="py-3 text-sm text-gray-800 font-medium">{church.name}</td>
                        <td className="py-3 text-sm text-gray-600 text-right">{church.pageViews || 0}</td>
                        <td className="py-3 text-sm text-gray-600 text-right font-semibold">{church.leads}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
