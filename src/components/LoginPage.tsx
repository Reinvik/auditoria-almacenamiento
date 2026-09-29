import { useState } from 'react';
import { supabase } from '../lib/supabase';
import cialLogo from '../assets/cial-alimentos-logo.png';
import { Mail, Lock, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff, RotateCcw, Boxes } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgot';

const ALLOWED_DOMAIN = 'cial.cl';

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const validateDomain = (mail: string): boolean => {
    const domain = mail.split('@')[1]?.toLowerCase();
    return domain === ALLOWED_DOMAIN;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateDomain(email)) {
      setError('Solo se permiten correos corporativos @cial.cl para acceder al sistema.');
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { error: authError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Correo o contraseña incorrectos. Usa la misma cuenta de Nexus Outbound / CIAL.');
        } else {
          setError(authError.message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateDomain(email)) {
      setError('Solo se permiten correos corporativos @cial.cl para crear cuenta.');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            domain_verified: true,
            registered_at: new Date().toISOString()
          }
        }
      });

      if (authError) {
        if (authError.message.includes('User already registered') || authError.message.includes('already exists')) {
          const { error: loginErr } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
          if (loginErr) {
            setError('Esta cuenta ya existe. Ingresa con tu contraseña o usa recuperar contraseña.');
          }
        } else {
          setError(authError.message);
        }
      } else {
        if (data.session) return;
        const { error: loginErr } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (loginErr) {
          setSuccess('¡Cuenta registrada correctamente! Ya puedes ingresar.');
          setMode('login');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateDomain(email)) {
      setError('Solo se permiten correos corporativos @cial.cl.');
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: window.location.origin
      });

      if (authError) {
        setError(authError.message);
      } else {
        setSuccess(`Enlace de recuperación enviado a ${email}. Revisa tu bandeja de entrada.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
    setShowPassword(false);
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a5c36]">
      {/* Fondo con gradiente y formas sutiles */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#063d25] via-[#0a5c36] to-[#0d7a49]" />
        <div className="absolute top-[-120px] right-[-80px] w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-[-100px] left-[-60px] w-[400px] h-[400px] rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      {/* Card principal */}
      <div className="relative z-10 w-full max-w-md px-4 select-none">
        <div className="bg-white rounded-3xl shadow-2xl shadow-black/30 border border-white/50 overflow-hidden">
          
          {/* Header con identidad CIAL */}
          <div className="bg-gradient-to-br from-[#0a5c36] to-[#0d7a49] p-8 text-center relative">
            <div className="flex items-center justify-center gap-3.5 mb-3">
              <img
                src={cialLogo}
                alt="CiAL Alimentos"
                className="w-14 h-14 object-contain bg-white rounded-xl p-1 shadow-md"
              />
              <div className="text-left">
                <h1 className="text-white font-black text-lg leading-tight tracking-wide">
                  ALMACENAMIENTO
                </h1>
                <span className="text-emerald-200 font-bold text-xs tracking-widest uppercase">
                  Auditoría en Altura
                </span>
              </div>
            </div>
            
            <p className="text-emerald-100/90 text-xs font-medium">
              Control de Racks y Ocupación en Frío • CIAL Alimentos
            </p>
          </div>

          {/* Formulario */}
          <div className="p-8">
            {mode === 'login' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Iniciar Sesión</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Misma cuenta y contraseña de <span className="text-[#0a5c36] font-bold">Nexus Outbound</span>
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{success}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Correo Corporativo
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="usuario@cial.cl"
                        disabled={loading}
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#0a5c36] focus:ring-1 focus:ring-[#0a5c36]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Contraseña
                      </label>
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        className="text-xs text-[#0a5c36] hover:underline font-bold"
                      >
                        ¿Olvidaste tu clave?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={loading}
                        required
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#0a5c36] focus:ring-1 focus:ring-[#0a5c36]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-[#0a5c36] hover:bg-[#08482a] disabled:bg-slate-300 text-white py-3 rounded-xl text-sm font-extrabold transition-all shadow-md active:scale-98 cursor-pointer mt-2"
                  >
                    {loading ? (
                      <span>Validando credenciales...</span>
                    ) : (
                      <>
                        <span>Ingresar al Sistema</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="pt-4 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-500">
                    ¿No tienes cuenta aún?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="text-[#0a5c36] font-bold hover:underline"
                    >
                      Registrarme con @cial.cl
                    </button>
                  </p>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Crear Cuenta CIAL</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Válida para todo el ecosistema Nexus CIAL
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Correo Corporativo
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="usuario@cial.cl"
                        disabled={loading}
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#0a5c36]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Contraseña (mínimo 8 caracteres)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={loading}
                        required
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#0a5c36]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Confirmar Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={loading}
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#0a5c36]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-[#0a5c36] hover:bg-[#08482a] disabled:bg-slate-300 text-white py-3 rounded-xl text-sm font-extrabold transition-all shadow-md active:scale-98 cursor-pointer mt-2"
                  >
                    {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                  </button>
                </form>

                <div className="pt-4 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-xs text-slate-600 font-bold hover:text-[#0a5c36]"
                  >
                    ← Volver a Iniciar Sesión
                  </button>
                </div>
              </div>
            )}

            {mode === 'forgot' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Recuperar Clave</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Te enviaremos un correo de restablecimiento
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                    {success}
                  </div>
                )}

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Correo Corporativo
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="usuario@cial.cl"
                        disabled={loading}
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#0a5c36]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-[#0a5c36] hover:bg-[#08482a] disabled:bg-slate-300 text-white py-3 rounded-xl text-sm font-extrabold transition-all shadow-md active:scale-98 cursor-pointer mt-2"
                  >
                    {loading ? 'Enviando...' : 'Enviar Correo de Recuperación'}
                  </button>
                </form>

                <div className="pt-4 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="text-xs text-slate-600 font-bold hover:text-[#0a5c36]"
                  >
                    ← Volver a Iniciar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
