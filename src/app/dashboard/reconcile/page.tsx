import ReconcileClient from "./ReconcileClient";

export const metadata = {
  title: '��з��ʹ�ѭ�� | �к��Ѵ���',
};

export default function ReconcilePage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">��з��ʹ�ѭ�ո�Ҥ�� (Bank Reconciliation)</h1>
        <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-2xl">
          ��Ǩ�ͺ�ʹ�Թ����͹����Ҩ�ԧ� Statement ��Ҥ�âͧ�س ��º�Ѻ��Ի����ʹ�Թ�¡� "͹��ѵ�" �������к�
          ������������Թ��Һѭ�����º���� ������͡��¡�����ǡ� "��з��ʹ�����"
        </p>
      </div>
      <ReconcileClient />
    </div>
  );
}
