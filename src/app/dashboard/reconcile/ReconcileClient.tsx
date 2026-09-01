"use client";
import { useState } from "react";
import useSWR from "swr";
import { CheckCircle2, Search, ArrowRightLeft, FileSpreadsheet, AlertTriangle, ExternalLink } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface Tx {
  id: number;
  amount: string;
  paidAt: string;
  slipImageUrl: string;
  slipRefId: string | null;
  verifiedBy: string;
  houses: string;
}

export default function ReconcileClient() {
  const { data, error, mutate, isLoading } = useSWR<{ data: Tx[] }>("/api/transactions/reconcile", fetcher);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const txs = data?.data || [];
  
  const filtered = txs.filter(tx => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (tx.amount || "").includes(s) ||
      (tx.houses || "").toLowerCase().includes(s) ||
      (tx.slipRefId || "").toLowerCase().includes(s)
    );
  });

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(t => t.id));
    }
  };

  const handleReconcile = async () => {
    if (selectedIds.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/transactions/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionIds: selectedIds })
      });
      if (res.ok) {
        setSelectedIds([]);
        mutate();
      } else {
        alert("�Դ��ͼԴ��Ҵ㹡�á�з��ʹ");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmountSelected = selectedIds.reduce((sum, id) => {
    const tx = txs.find(t => t.id === id);
    return sum + parseFloat(tx?.amount || "0");
  }, 0);

  if (isLoading) {
    return <div className="animate-pulse space-y-4"><div className="h-10 bg-slate-200 rounded w-full max-w-sm"></div><div className="h-64 bg-slate-200 rounded-xl w-full"></div></div>;
  }
  if (error) return <div className="text-red-500">Error loading data</div>;

  return (
    <div className="space-y-6">
      
      {/* Tools Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="���Ҩӹǹ�Թ, ��ҹ�Ţ���, ���� Ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[blue-600]"
          />
        </div>

        <button 
          onClick={handleReconcile}
          disabled={selectedIds.length === 0 || isSubmitting}
          className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 text-white text-sm font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : <CheckCircle2 size={16} />}
          ��з��ʹ ({selectedIds.length}) ��¡��
        </button>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-[#ECFDF5] border border-[#10B981]/30 p-4 rounded-xl flex items-center gap-3">
          <FileSpreadsheet className="text-[#10B981]" size={20} />
          <div className="text-sm font-medium text-[#047857]">
            �س���ѧ���͡ {selectedIds.length} ��¡�� ������Թ <span className="font-bold text-lg">{totalAmountSelected.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span> �ҷ
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                    onChange={selectAll}
                    className="w-4 h-4 rounded border-slate-300 text-[blue-600] focus:ring-[blue-600]"
                  />
                </th>
                <th className="px-6 py-4">�ѹ���/���Ҫ���</th>
                <th className="px-6 py-4">��ҹ�Ţ���</th>
                <th className="px-6 py-4 text-right">�ӹǹ�Թ</th>
                <th className="px-6 py-4">����Ǩ�ͺ</th>
                <th className="px-6 py-4">��ҧ�ԧ��Ի (Ref)</th>
                <th className="px-6 py-4 text-center">��Ի</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <CheckCircle2 className="mx-auto mb-3 text-emerald-500" size={32} />
                    �ʹ������! �ء��¡�ö١��з��ʹ���º��������
                  </td>
                </tr>
              ) : filtered.map(tx => (
                <tr key={tx.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(tx.id) ? 'bg-[blue-600]/5' : ''}`}>
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(tx.id)}
                      onChange={() => toggleSelect(tx.id)}
                      className="w-4 h-4 rounded border-slate-300 text-[blue-600] focus:ring-[blue-600]"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {tx.paidAt ? new Date(tx.paidAt).toLocaleString('th-TH') : '-'}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">
                    {tx.houses || '��辺������'}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-emerald-600">
                    �{parseFloat(tx.amount || "0").toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                      {tx.verifiedBy}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs text-slate-500 truncate max-w-[120px]" title={tx.slipRefId || ''}>
                      {tx.slipRefId || <span className="text-slate-300 italic">����բ�����</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <a href={tx.slipImageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-[blue-600] hover:bg-[blue-600]/10 rounded-lg transition-colors">
                      <ExternalLink size={16} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
