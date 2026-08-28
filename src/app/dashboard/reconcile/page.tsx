import ReconcileClient from "./ReconcileClient";

export const metadata = {
  title: 'กระทบยอดบัญชี | ระบบจัดเก็บ',
};

export default function ReconcilePage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">กระทบยอดบัญชีธนาคาร (Bank Reconciliation)</h1>
        <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-2xl">
          ตรวจสอบยอดเงินเข้าบัญชีจริงจาก Statement ธนาคารของคุณ เทียบกับสลิปที่กดยืนยัน "อนุมัติ" แล้วในระบบ
          เพื่อให้มั่นใจว่าเงินเข้าบัญชีเรียบร้อย และเปลี่ยนสถานะรายการเป็น "กระทบยอดแล้ว"
        </p>
      </div>
      <ReconcileClient />
    </div>
  );
}
