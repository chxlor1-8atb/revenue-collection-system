"use client";

import { useState } from "react";
import { Wallet, Plus, CheckCircle2, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WalletModalButton({ houseId, currentWallet }: { houseId: number; currentWallet: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [action, setAction] = useState<"add" | "set">("add");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) < 0) {
      alert("��سҡ�͡�ӹǹ�Թ���١��ͧ");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/houses/${houseId}/wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, action })
      });

      if (res.ok) {
        setIsOpen(false);
        setAmount("");
        router.refresh();
      } else {
        alert("�Դ��ͼԴ��Ҵ㹡�û�Ѻ�ʹ�������Թ");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-colors border border-emerald-200 cursor-pointer"
        title="����Թ / ��Ѻ�ʹ�Թ㹡�����"
      >
        <Wallet size={14} /> ��Ѻ�ʹ������
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" onClick={() => setIsOpen(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full relative" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Wallet className="text-emerald-600" size={20} />
                ��Ѻ�ʹ�Թ㹡����� (Wallet)
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
              <span className="text-xs font-medium text-slate-500">�ʹ�Թ�Ѩ�غѹ:</span>
              <span className="font-mono font-bold text-emerald-600 text-base">�{parseFloat(currentWallet || "0").toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">�ٻẺ��û�Ѻ��ا</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAction("add")}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${action === 'add' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                >
                  ? ����Թ���� (Add)
                </button>
                <button
                  type="button"
                  onClick={() => setAction("set")}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${action === 'set' ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200'}`}
                >
                  ?? ��˹��ʹ���� (Set)
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                {action === 'add' ? '�ӹǹ�Թ����ͧ������ (�ҷ)' : '�ʹ�Թ�ط�Է���ͧ��õ�� (�ҷ)'}
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-lg font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setIsOpen(false)} disabled={isLoading} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl">¡��ԡ</button>
              <button onClick={handleUpdate} disabled={isLoading} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2">
                {isLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 size={16} />}
                �ѹ�֡�ʹ�Թ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
