import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Search, Wallet, Repeat, LogOut, 
  ChevronLeft, ChevronRight, Check, X, AlertCircle, 
  Copy, Download, Shield, User, Phone, Lock, CheckCircle2,
  TrendingUp, Activity, Coins, ArrowUpRight, ArrowDownLeft, ShieldCheck
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

/* ================= UTILS ================= */
const inr = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(n) || 0);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const genId = () => 'MQ-' + Math.random().toString(36).substring(2, 8).toUpperCase();

const getDB = () => {
  const data = localStorage.getItem('mq-db');
  if (!data) {
    return { users: [{ phone: 'admin', password: 'admin', role: 'admin', name: 'Admin' }], transactions: [] };
  }
  return JSON.parse(data);
};
const saveDB = (db) => localStorage.setItem('mq-db', JSON.stringify(db));

/* ================= COMPONENTS ================= */
const Button = ({ variant = 'primary', className = '', children, ...rest }) => {
  const base = 'inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-4 text-[14px] font-semibold transition-all duration-200 active:scale-[.97] disabled:opacity-50';
  const skin = variant === 'primary' 
    ? 'text-[#03130E] bg-gradient-to-b from-[#4AFFD0] to-[#00E0A8] shadow-[0_12px_38px_-12px_rgba(0,224,168,1)]' 
    : 'border border-white/10 bg-white/[0.035] text-ink hover:bg-white/[0.08]';
  return <button className={`${base} ${skin} ${className}`} {...rest}>{children}</button>;
};

const Input = ({ label, icon: Icon, ...rest }) => (
  <div className="space-y-1.5">
    {label && <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</label>}
    <div className="relative">
      {Icon && <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />}
      <input className={`input ${Icon ? 'pl-10' : ''}`} {...rest} />
    </div>
  </div>
);

/* ================= AUTH SCREEN ================= */
function AuthScreen({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const db = getDB();
    
    if (isLogin) {
      const user = db.users.find(u => u.phone === phone && u.password === password);
      if (user) onLogin(user);
      else setError('Invalid phone or password');
    } else {
      if (password !== confirm) return setError('Passwords do not match');
      if (phone.length < 10) return setError('Enter a valid 10-digit phone number');
      if (db.users.find(u => u.phone === phone)) return setError('Phone number already registered');
      
      setLoading(true);
      await sleep(800);
      const newUser = { phone, password, name: 'User ' + phone.slice(-4), role: 'user', balance: 0, invested: 0 };
      db.users.push(newUser);
      saveDB(db);
      setLoading(false);
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-pageIn">
      <div className="panel-glow w-full max-w-sm rounded-3xl p-8 bg-surface/50 backdrop-blur-xl border border-emerald/20">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-ink">Maha<span className="text-emerald">Quant</span></h1>
          <p className="text-sm text-muted mt-2">{isLogin ? 'Welcome back' : 'Create your account'}</p>
        </div>

        {error && <div className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-400 flex items-center gap-2"><AlertCircle size={16}/> {error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Phone Number" icon={Phone} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,''))} placeholder="10-digit number" maxLength={10} required />
          <Input label="Password" icon={Lock} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          
          {!isLogin && (
            <Input label="Confirm Password" icon={Lock} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required />
          )}

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted">{isLogin ? "Don't have an account? " : "Already have an account? "}</span>
          <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-emerald font-semibold hover:underline">
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
        
        {/* Quick Admin Login for testing */}
        <div className="mt-4 pt-4 border-t border-white/10 text-center">
          <button onClick={() => { setPhone('admin'); setPassword('admin'); setIsLogin(true); }} className="text-[11px] text-muted hover:text-emerald">
            Login as Admin (Test)
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= ADMIN PANEL ================= */
function AdminPanel({ user, onLogout }) {
  const [db, setDb] = useState(getDB());

  const refresh = () => setDb(getDB());

  const handleAction = (txId, action) => {
    const newDb = getDB();
    const tx = newDb.transactions.find(t => t.id === txId);
    if (!tx) return;

    tx.status = action === 'approve' ? 'SETTLED' : 'REJECTED';
    
    if (action === 'approve' && tx.type === 'DEPOSIT') {
      const u = newDb.users.find(u => u.phone === tx.userPhone);
      if (u) u.balance += tx.amount;
    }
    
    saveDB(newDb);
    refresh();
  };

  return (
    <div className="min-h-screen bg-bg text-ink p-4 sm:p-8 animate-pageIn">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-display text-2xl font-bold">Admin Control</h1>
            <p className="text-muted text-sm">Manage user deposits & withdrawals</p>
          </div>
          <Button variant="ghost" onClick={onLogout}><LogOut size={16}/> Logout</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="panel p-6 bg-surface/50 border border-white/10 rounded-2xl">
            <h2 className="font-semibold mb-4 text-emerald flex items-center gap-2"><User size={18}/> Users</h2>
            <div className="space-y-3">
              {db.users.map(u => (
                <div key={u.phone} className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-muted text-xs">{u.phone}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald font-semibold">{inr(u.balance)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-6 bg-surface/50 border border-white/10 rounded-2xl">
            <h2 className="font-semibold mb-4 text-gold flex items-center gap-2"><Activity size={18}/> Pending Transactions</h2>
            <div className="space-y-3">
              {db.transactions.filter(t => t.status === 'PENDING').length === 0 && (
                <p className="text-sm text-muted">No pending transactions.</p>
              )}
              {db.transactions.filter(t => t.status === 'PENDING').map(tx => (
                <div key={tx.id} className="bg-black/30 p-3 rounded-xl border border-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-sm">{tx.type} <span className="text-muted text-xs">{tx.id}</span></div>
                      <div className="text-xs text-muted">{tx.userPhone}</div>
                    </div>
                    <div className="font-bold text-emerald">{inr(tx.amount)}</div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleAction(tx.id, 'approve')} className="flex-1 bg-emerald/20 text-emerald text-xs font-bold py-2 rounded-lg hover:bg-emerald/30">Approve</button>
                    <button onClick={() => handleAction(tx.id, 'reject')} className="flex-1 bg-red-500/20 text-red-400 text-xs font-bold py-2 rounded-lg hover:bg-red-500/30">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= DASHBOARD ================= */
function Dashboard({ user }) {
  return (
    <div className="space-y-4 animate-pageIn">
      <div className="flex justify-between items-end px-1">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-muted">PORTFOLIO</p>
          <h1 className="text-2xl font-bold text-ink mt-1">{user.name}</h1>
        </div>
      </div>

      <div className="panel-glow p-6 relative overflow-hidden rounded-3xl bg-surface/50 border border-emerald/20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald/10 blur-3xl rounded-full" />
        <p className="text-xs font-semibold tracking-wider text-muted">AVAILABLE BALANCE</p>
        <h2 className="text-4xl font-bold text-ink mt-2 num">{inr(user.balance)}</h2>
        
        <div className="mt-6 flex gap-3">
           <div className="flex-1 bg-black/20 p-3 rounded-xl border border-white/5">
             <p className="text-[10px] text-muted">Total Invested</p>
             <p className="font-semibold text-gold">{inr(user.invested)}</p>
           </div>
        </div>
      </div>
    </div>
  );
}

/* ================= WITHDRAWAL KEYPAD ================= */
function WithdrawalFlow({ user, onSuccess }) {
  const [step, setStep] = useState('method'); // method | amount | success
  const [method, setMethod] = useState(null);
  const [amountStr, setAmountStr] = useState('0');
  const [txId, setTxId] = useState('');

  const numAmount = parseFloat(amountStr) || 0;

  const handleKey = (key) => {
    if (key === 'del') {
      setAmountStr(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else if (key === '.') {
      if (!amountStr.includes('.')) setAmountStr(prev => prev + '.');
    } else {
      setAmountStr(prev => prev === '0' ? key : prev + key);
    }
  };

  const submitWithdrawal = () => {
    if (numAmount <= 0 || numAmount > user.balance) return;
    const id = genId();
    const db = getDB();
    db.transactions.push({
      id, userPhone: user.phone, type: 'WITHDRAWAL', method, amount: numAmount, status: 'PENDING', date: new Date().toISOString()
    });
    saveDB(db);
    setTxId(id);
    setStep('success');
  };

  if (step === 'method') {
    return (
      <div className="space-y-4 animate-pageIn">
        <h1 className="text-2xl font-bold text-ink mb-6">Withdraw Funds</h1>
        
        <button onClick={() => { setMethod('USDT BEP20'); setStep('amount'); }} className="w-full panel p-5 flex items-center justify-between border-emerald/20 bg-emerald/[0.03] hover:bg-emerald/[0.08] transition rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald/20 flex items-center justify-center text-emerald"><Coins size={20}/></div>
            <div className="text-left">
              <div className="font-bold text-ink">USDT (BEP20 Chain)</div>
              <div className="text-xs text-muted">Binance Smart Chain</div>
            </div>
          </div>
          <ChevronRight size={20} className="text-muted"/>
        </button>

        <button onClick={() => { setMethod('Safe UPI'); setStep('amount'); }} className="w-full panel p-5 flex items-center justify-between border-emerald/20 bg-emerald/[0.03] hover:bg-emerald/[0.08] transition rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald/20 flex items-center justify-center text-emerald"><ShieldCheck size={20}/></div>
            <div className="text-left">
              <div className="font-bold text-ink">Safe UPI</div>
              <div className="text-xs text-muted">Instant Bank Transfer</div>
            </div>
          </div>
          <ChevronRight size={20} className="text-muted"/>
        </button>

        <button onClick={() => { setMethod('Netbank'); setStep('amount'); }} className="w-full panel p-5 flex items-center justify-between border-gold/20 bg-gold/[0.03] hover:bg-gold/[0.08] transition rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold"><TrendingUp size={20}/></div>
            <div className="text-left">
              <div className="font-bold text-ink">Netbanking</div>
              <div className="text-xs text-muted">Direct Bank Transfer</div>
            </div>
          </div>
          <ChevronRight size={20} className="text-muted"/>
        </button>
      </div>
    );
  }

  if (step === 'amount') {
    return (
      <div className="h-[calc(100vh-140px)] flex flex-col animate-pageIn">
        <div className="flex items-center justify-between pt-4 pb-6">
          <button onClick={() => setStep('method')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><ChevronLeft size={20}/></button>
          <span className="font-semibold text-sm">Amount</span>
          <div className="w-10" />
        </div>

        <div className="text-center mb-4">
          <p className="text-xs text-muted">To: {method} Address</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-[64px] font-display font-semibold text-ink num leading-none">{amountStr}</div>
          <div className="text-lg text-muted mt-2">≈ {inr(numAmount)}</div>
        </div>

        <div className="panel p-4 rounded-2xl flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald/20 flex items-center justify-center text-emerald"><Wallet size={20}/></div>
            <div>
              <div className="font-bold text-sm">{method === 'USDT BEP20' ? 'USDT' : 'INR'}</div>
              <div className="text-xs text-muted">{inr(user.balance)}</div>
            </div>
          </div>
          <button onClick={() => setAmountStr(user.balance.toString())} className="px-4 py-2 rounded-full bg-white/10 text-xs font-bold hover:bg-white/20">Max</button>
        </div>

        <div className="grid grid-cols-3 gap-y-2 pb-6">
          {[1,2,3,4,5,6,7,8,9,'.',0,'del'].map(k => (
            <button key={k} onClick={() => handleKey(k)} className="h-14 text-2xl font-semibold active:bg-white/10 rounded-xl transition flex items-center justify-center">
              {k === 'del' ? <ChevronLeft size={24} /> : k}
            </button>
          ))}
        </div>

        <Button onClick={submitWithdrawal} disabled={numAmount <= 0 || numAmount > user.balance} className="w-full">
          Review
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center animate-pageIn">
      <div className="w-20 h-20 rounded-full bg-emerald/20 flex items-center justify-center mb-6">
        <CheckCircle2 size={40} className="text-emerald" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Request Submitted</h2>
      <p className="text-muted text-sm mb-6 max-w-[250px]">Your withdrawal is requested and will be processed under 2 hours.</p>
      
      <div className="panel p-4 rounded-xl w-full max-w-xs mb-6 border-emerald/30 bg-emerald/5">
        <p className="text-[10px] text-muted uppercase tracking-widest mb-1">Tracking ID</p>
        <p className="text-xl font-mono font-bold text-emerald">{txId}</p>
      </div>

      <Button onClick={() => setStep('method')} className="w-full max-w-xs">Done</Button>
    </div>
  );
}

/* ================= DEPOSIT / PAYMENT ================= */
function DepositFlow({ user }) {
  const [amount, setAmount] = useState('');
  const [utr, setUtr] = useState('');
  const [step, setStep] = useState('form'); // form | success
  const [txId, setTxId] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if(!amount || !utr) return;
    setLoading(true);
    await sleep(1000);
    const id = genId();
    const db = getDB();
    db.transactions.push({
      id, userPhone: user.phone, type: 'DEPOSIT', method: 'UPI', amount: Number(amount), utr, status: 'PENDING', date: new Date().toISOString()
    });
    saveDB(db);
    setTxId(id);
    setLoading(false);
    setStep('success');
  };

  if (step === 'success') {
    return (
      <div className="text-center pt-10 animate-pageIn">
        <div className="w-20 h-20 rounded-full bg-emerald/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-emerald" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Payment Submitted</h2>
        <p className="text-muted text-sm mb-6">Pending Admin Approval</p>
        
        <div className="panel p-4 rounded-xl w-full max-w-xs mx-auto mb-6 border-emerald/30 bg-emerald/5">
          <p className="text-[10px] text-muted uppercase tracking-widest mb-1">Tracking ID</p>
          <p className="text-xl font-mono font-bold text-emerald">{txId}</p>
        </div>
        
        <Button onClick={() => setStep('form')} className="w-full max-w-xs mx-auto">New Payment</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-pageIn">
      <h1 className="text-2xl font-bold text-ink mb-4">Add Funds</h1>
      
      <div className="panel p-6 rounded-3xl flex flex-col items-center border-emerald/20">
        <div className="bg-white p-3 rounded-2xl mb-4">
          <QRCodeSVG value="upi://pay?pa=mahaquant@upi&pn=MahaQuant" size={160} />
        </div>
        <p className="text-xs text-muted mb-1">Scan to pay via UPI</p>
        <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/10 mt-2">
          <span className="text-sm font-mono text-ink">mahaquant@upi</span>
          <button onClick={() => navigator.clipboard.writeText('mahaquant@upi')} className="text-emerald"><Copy size={14}/></button>
        </div>
      </div>

      <div className="panel p-6 rounded-3xl space-y-4">
        <Input label="Amount (INR)" placeholder="e.g. 5000" value={amount} onChange={e => setAmount(e.target.value.replace(/\D/g,''))} />
        <Input label="UTR / Reference No." placeholder="12-digit UTR" value={utr} onChange={e => setUtr(e.target.value)} />
        <Button onClick={submit} disabled={loading || !amount || !utr} className="w-full">
          {loading ? 'Submitting...' : 'Submit Deposit'}
        </Button>
      </div>
    </div>
  );
}

/* ================= TRACKING ================= */
function Track() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const search = () => {
    const db = getDB();
    const tx = db.transactions.find(t => t.id.toLowerCase() === code.trim().toLowerCase() || t.utr === code.trim());
    if (tx) { setResult(tx); setError(''); }
    else { setResult(null); setError('Transaction not found'); }
  };

  return (
    <div className="space-y-4 animate-pageIn">
      <h1 className="text-2xl font-bold text-ink mb-4">Track Transaction</h1>
      
      <div className="panel p-6 rounded-3xl">
        <Input label="Transaction ID" placeholder="e.g. MQ-AB1234" value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }} />
        <Button onClick={search} className="w-full mt-4">Check Status</Button>
        {error && <p className="text-red-400 text-sm mt-3 text-center">{error}</p>}
      </div>

      {result && (
        <div className="panel p-6 rounded-3xl animate-pageIn">
          <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider">{result.type}</p>
              <p className="font-mono font-bold text-ink">{result.id}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.status === 'SETTLED' ? 'bg-emerald/20 text-emerald' : result.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' : 'bg-gold/20 text-gold'}`}>
              {result.status}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted">Amount</span><span className="font-bold text-ink">{inr(result.amount)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Date</span><span className="text-ink">{new Date(result.date).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted">Method</span><span className="text-ink">{result.method}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= MAIN APP ================= */
export default function App() {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('mq-user');
    return saved ? JSON.parse(saved) : null;
  });
  const [view, setView] = useState('dashboard');
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    if (showIntro) {
      const t = setTimeout(() => setShowIntro(false), 3000);
      return () => clearTimeout(t);
    }
  }, [showIntro]);

  const handleLogin = (u) => {
    setUser(u);
    sessionStorage.setItem('mq-user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('mq-user');
  };

  if (showIntro) {
    return (
      <div className="fixed inset-0 bg-[#050A0E] flex items-center justify-center z-50">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1 }} className="text-center">
          <h1 className="text-4xl font-display font-bold text-ink mb-2">Maha<span className="text-emerald">Quant</span></h1>
          <p className="text-xs tracking-[0.4em] text-gold uppercase">Gain with Grains</p>
        </motion.div>
      </div>
    );
  }

  if (!user) return <AuthScreen onLogin={handleLogin} />;
  if (user.role === 'admin') return <AdminPanel user={user} onLogout={handleLogout} />;

  const NavItem = ({ id, icon: Icon, label }) => (
    <button onClick={() => setView(id)} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition ${view === id ? 'text-emerald bg-emerald/10' : 'text-muted hover:text-ink'}`}>
      <Icon size={20} className={view === id ? 'drop-shadow-[0_0_8px_rgba(0,224,168,0.8)]' : ''} />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-40 px-4 pt-4 pb-2 flex justify-between items-center bg-bg/80 backdrop-blur-md">
        <h1 className="font-display font-bold text-lg text-ink">Maha<span className="text-emerald">Quant</span></h1>
        <button onClick={handleLogout} className="p-2 text-muted hover:text-red-400"><LogOut size={18} /></button>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4">
        {view === 'dashboard' && <Dashboard user={user} />}
        {view === 'payment' && <DepositFlow user={user} />}
        {view === 'track' && <Track />}
        {view === 'exit' && <WithdrawalFlow user={user} />}
        {view === 'reinvest' && <div className="text-center text-muted mt-10">Reinvest Module (Coming Soon)</div>}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-50 p-4 pb-6 bg-gradient-to-t from-bg to-transparent">
        <div className="max-w-md mx-auto panel rounded-full flex justify-between px-4 py-2">
          <NavItem id="dashboard" icon={LayoutDashboard} label="Home" />
          <NavItem id="track" icon={Search} label="Track" />
          <NavItem id="payment" icon={Wallet} label="Pay" />
          <NavItem id="exit" icon={ArrowUpRight} label="Exit" />
        </div>
      </nav>
    </div>
  );
}
