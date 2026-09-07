import { Loader } from 'lucide-react'

export default function AdminLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="p-4 bg-white rounded-full shadow-sm border border-gray-100">
        <Loader size={32} className="animate-spin text-green-600" />
      </div>
      <p className="text-gray-500 font-medium">Carregando dados...</p>
    </div>
  )
}
