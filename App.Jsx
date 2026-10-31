import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, TrendingDown, Plus, Search, Calendar, Tag, 
  DollarSign, Percent, BarChart2, BookOpen, Trash2, Edit3, 
  Filter, CheckCircle, AlertCircle, Sparkles, Award, Shield, 
  ArrowUpRight, ArrowDownRight, X, Globe, Layers, Activity,
  Radio, Clock, RefreshCw, ExternalLink, Zap, LogIn, LogOut, User, Lock, Mail, PlusCircle, Crown, Gem, Compass, Brain
} from 'lucide-react';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';

// Setup Firebase Initialization
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : { apiKey: "demo", authDomain: "demo.firebaseapp.com", projectId: "demo" };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'mindmill-journal-app';

// Sample initial trading journal data
const INITIAL_NOTES = [
  {
    id: '1',
    date: '2025-02-18',
    title: 'NAS100 Tech Breakout Surge',
    marketType: 'Indices',
    symbol: 'NAS100',
    category: 'Breakout',
    tags: ['Tech', 'NAS100', 'Futures'],
    type: 'WIN',
    content: 'Caught the morning explosive rally on NAS100 after breaking above 21,500 resistance.',
    open: 21450,
    high: 21980,
    low: 21420,
    close: 21950,
    pnl: 1250.00,
    pnlPercent: 4.8,
    lessons: 'Letting winners run on index momentum pays off massively.'
  },
  {
    id: '2',
    date: '2025-02-19',
    title: 'S&P 500 False Breakdown Reversal',
    marketType: 'Indices',
    symbol: 'SP500',
    category: 'Reversal',
    tags: ['SP500', 'Index'],
    type: 'LOSS',
    content: 'Tried shorting the morning dip on S&P 500 expecting deeper correction.',
    open: 5880,
    high: 5910,
    low: 5855,
    close: 5905,
    pnl: -350.00,
    pnlPercent: -1.8,
    lessons: 'Do not fade strong trend days without confirmation.'
  },
  {
    id: '3',
    date: '2025-02-20',
    title: 'Gold (XAUUSD) Safe Haven Spike',
    marketType: 'Forex',
    symbol: 'XAUUSD',
    category: 'Momentum',
    tags: ['Gold', 'Forex'],
    type: 'WIN',
    content: 'Entered long position at $2,640 level following economic news breakout.',
    open: 2640,
    high: 2685,
    low: 2635,
    close: 2680,
    pnl: 2100.00,
    pnlPercent: 6.2,
    lessons: 'High impact economic events create clean multi-day continuation trends.'
  }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [notes, setNotes] = useState(INITIAL_NOTES);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [marketFilter, setMarketFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // News State
  const [newsEvents, setNewsEvents] = useState([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [newsFilterCurrency, setNewsFilterCurrency] = useState('ALL');
  const [newsDateFilter, setNewsDateFilter] = useState('');
  const [isCustomNewsModalOpen, setIsCustomNewsModalOpen] = useState(false);
  const [customNewsData, setCustomNewsData] = useState({
    title: '',
    country: 'USD',
    date: new Date().toISOString().split('T')[0],
    time: '08:30',
    impact: 'High',
    forecast: '',
    previous: ''
  });

  // Auth Initialization
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.warn("Auth token initialization error:", err);
      } font-finally {
        setAuthLoading(false);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Cloud Sync with Firestore
  useEffect(() => {
    if (!user) return;

    const userNotesCol = collection(db, 'artifacts', appId, 'users', user.uid, 'trade_notes');

    const unsubscribe = onSnapshot(
      userNotesCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedNotes = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data()
          }));
          setNotes(loadedNotes);
          if (!selectedNoteId && loadedNotes.length > 0) {
            setSelectedNoteId(loadedNotes[0].id);
          }
        }
      },
      (error) => {
        console.error("Firestore sync error:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Handle Google Auth
  const handleGoogleSignIn = async () => {
    setAuthError('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setAuthModalOpen(false);
    } catch (err) {
      setAuthError(err.message || 'Google sign-in failed.');
    }
  };

  // Handle Email / Password Auth
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setAuthModalOpen(false);
      setEmail('');
      setPassword('');
    } catch (err) {
      setAuthError(err.message || 'Authentication failed.');
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await signInAnonymously(auth);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  // Fetch News Calendar
  const fetchForexFactoryNews = async () => {
    setIsNewsLoading(true);
    try {
      const response = await fetch('https://nfp.forexfactory.com/ff_calendar_thisweek.json');
      if (!response.ok) throw new Error('Network response failed');
      const data = await response.json();
      
      const formattedData = data.map((item, idx) => ({
        id: `ff-${idx}-${item.date}`,
        title: item.title || 'Economic Event',
        country: item.country || 'USD',
        date: item.date ? item.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
        time: item.time || 'All Day',
        impact: item.impact || 'Low',
        forecast: item.forecast || '--',
        previous: item.previous || '--'
      }));

      setNewsEvents(formattedData);
    } catch (err) {
      setNewsEvents([
        { id: 'ff-1', title: 'Core CPI m/m', country: 'USD', date: new Date().toISOString().slice(0, 10), time: '8:30am', impact: 'High', forecast: '0.3%', previous: '0.2%' },
        { id: 'ff-2', title: 'FOMC Statement & Rate Decision', country: 'USD', date: new Date().toISOString().slice(0, 10), time: '2:00pm', impact: 'High', forecast: '4.50%', previous: '4.75%' }
      ]);
    } finally {
      setIsNewsLoading(false);
    }
  };

  useEffect(() => {
    fetchForexFactoryNews();
  }, []);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    marketType: 'Indices',
    symbol: 'NAS100',
    category: 'Breakout',
    tags: '',
    type: 'WIN',
    open: '',
    high: '',
    low: '',
    close: '',
    pnl: '',
    pnlPercent: '',
    content: '',
    lessons: ''
  });

  // Add Custom News Event
  const handleAddCustomNews = (e) => {
    e.preventDefault();
    const newEvent = {
      id: `custom-${Date.now()}`,
      title: customNewsData.title,
      country: customNewsData.country.toUpperCase(),
      date: customNewsData.date,
      time: customNewsData.time || 'All Day',
      impact: customNewsData.impact,
      forecast: customNewsData.forecast || '--',
      previous: customNewsData.previous || '--'
    };

    setNewsEvents([newEvent, ...newsEvents]);
    setIsCustomNewsModalOpen(false);
    setCustomNewsData({
      title: '',
      country: 'USD',
      date: new Date().toISOString().split('T')[0],
      time: '08:30',
      impact: 'High',
      forecast: '',
      previous: ''
    });
  };

  // Filtered notes
  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch = 
        note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesMarket = marketFilter === 'ALL' || note.marketType === marketFilter;
      const matchesType = typeFilter === 'ALL' || note.type === typeFilter;

      return matchesSearch && matchesMarket && matchesType;
    });
  }, [notes, searchTerm, marketFilter, typeFilter]);

  // Selected note object
  const selectedNote = useMemo(() => {
    return notes.find(n => n.id === selectedNoteId) || notes[0];
  }, [notes, selectedNoteId]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = notes.length;
    if (total === 0) return { winRate: 0, totalPnl: 0, profitFactor: 0, bestWin: 0, worstLoss: 0 };

    const wins = notes.filter(n => n.type === 'WIN');
    const losses = notes.filter(n => n.type === 'LOSS');
    const winRate = ((wins.length / total) * 100).toFixed(1);

    const totalPnl = notes.reduce((acc, n) => acc + (Number(n.pnl) || 0), 0);
    const grossProfit = wins.reduce((acc, n) => acc + Math.max(0, Number(n.pnl) || 0), 0);
    const grossLoss = Math.abs(losses.reduce((acc, n) => acc + Math.min(0, Number(n.pnl) || 0), 0));
    const profitFactor = grossLoss === 0 ? grossProfit.toFixed(2) : (grossProfit / grossLoss).toFixed(2);

    const bestWin = Math.max(...notes.map(n => Number(n.pnl) || 0), 0);
    const worstLoss = Math.min(...notes.map(n => Number(n.pnl) || 0), 0);

    return { winRate, totalPnl, profitFactor, bestWin, worstLoss, totalTrades: total };
  }, [notes]);

  // Handle saving note
  const handleSaveNote = async (e) => {
    e.preventDefault();
    const tagArray = formData.tags
      ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [formData.symbol, formData.marketType];

    const isWin = formData.type === 'WIN';
    const defaultPnl = isWin ? 500 : -200;
    const noteId = editingNote ? editingNote.id : Date.now().toString();

    const noteObj = {
      date: formData.date || new Date().toISOString().split('T')[0],
      title: formData.title,
      marketType: formData.marketType,
      symbol: formData.symbol.toUpperCase() || 'NAS100',
      category: formData.category,
      tags: tagArray,
      type: formData.type,
      open: parseFloat(formData.open) || 1000,
      high: parseFloat(formData.high) || 1050,
      low: parseFloat(formData.low) || 980,
      close: parseFloat(formData.close) || (isWin ? 1040 : 990),
      pnl: !Number.isNaN(parseFloat(formData.pnl)) ? parseFloat(formData.pnl) : defaultPnl,
      pnlPercent: parseFloat(formData.pnlPercent) || (isWin ? 2.5 : -1.5),
      content: formData.content,
      lessons: formData.lessons
    };

    if (user && !user.isAnonymous) {
      try {
        const noteRef = doc(db, 'artifacts', appId, 'users', user.uid, 'trade_notes', noteId);
        await setDoc(noteRef, noteObj, { merge: true });
      } catch (err) {
        console.error("Error writing note to Firestore:", err);
      }
    } else {
      if (editingNote) {
        setNotes(notes.map(n => n.id === editingNote.id ? { id: noteId, ...noteObj } : n));
      } else {
        setNotes([{ id: noteId, ...noteObj }, ...notes]);
      }
    }

    setIsModalOpen(false);
    setEditingNote(null);
    resetForm();
    setSelectedNoteId(noteId);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      marketType: 'Indices',
      symbol: 'NAS100',
      category: 'Breakout',
      tags: '',
      type: 'WIN',
      open: '',
      high: '',
      low: '',
      close: '',
      pnl: '',
      pnlPercent: '',
      content: '',
      lessons: ''
    });
  };

  const handleEditClick = (note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      date: note.date,
      marketType: note.marketType || 'Indices',
      symbol: note.symbol || 'NAS100',
      category: note.category,
      tags: note.tags?.join(', ') || '',
      type: note.type,
      open: note.open,
      high: note.high,
      low: note.low,
      close: note.close,
      pnl: note.pnl,
      pnlPercent: note.pnlPercent,
      content: note.content,
      lessons: note.lessons
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this note?')) {
      if (user && !user.isAnonymous) {
        try {
          const noteRef = doc(db, 'artifacts', appId, 'users', user.uid, 'trade_notes', id);
          await deleteDoc(noteRef);
        } catch (err) {
          console.error("Error deleting note:", err);
        }
      } else {
        const remaining = notes.filter(n => n.id !== id);
        setNotes(remaining);
        if (selectedNoteId === id) {
          setSelectedNoteId(remaining[0]?.id || null);
        }
      }
    }
  };

  const filteredNews = useMemo(() => {
    return newsEvents.filter(event => {
      const matchesCurrency = newsFilterCurrency === 'ALL' || event.country === newsFilterCurrency;
      const matchesDate = !newsDateFilter || event.date === newsDateFilter;
      return matchesCurrency && matchesDate;
    });
  }, [newsEvents, newsFilterCurrency, newsDateFilter]);

  return (
    <div className="min-h-screen bg-[#08090C] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950 relative overflow-x-hidden">
      
      {/* Luxury Ambient Metallic Background Glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[160px] pointer-events-none"></div>

      {/* Top Header - Glassmorphic Gold/Obsidian */}
      <header className="border-b border-amber-500/10 bg-[#0C0E14]/80 backdrop-blur-md sticky top-0 z-30 px-6 lg:px-12 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-3.5">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-300/30">
            <Brain className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black tracking-widest uppercase bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent font-mono">
                MINDMILL
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 tracking-wider uppercase">
                PRO JOURNAL
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-wide font-light">Master the Mindset Behind the Chart</p>
          </div>
        </div>

        {/* Luxury Navigation Pill */}
        <div className="hidden md:flex items-center bg-[#050608] p-1.5 rounded-2xl border border-amber-500/15 shadow-inner">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25' : 'text-slate-400 hover:text-amber-200'}`}
          >
            Candlestick Chart
          </button>
          <button 
            onClick={() => setActiveTab('notes')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'notes' ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25' : 'text-slate-400 hover:text-amber-200'}`}
          >
            Journal Entries ({notes.length})
          </button>
          <button 
            onClick={() => setActiveTab('news')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center space-x-2 ${activeTab === 'news' ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/25' : 'text-slate-400 hover:text-amber-200'}`}
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-rose-500" />
            <span>Market Intelligence</span>
          </button>
        </div>

        {/* User Auth & Actions */}
        <div className="flex items-center space-x-3">
          {user && !user.isAnonymous ? (
            <div className="flex items-center space-x-2 bg-[#050608] border border-amber-500/20 px-3 py-1.5 rounded-2xl shadow">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs border border-amber-500/30">
                {user.email ? user.email.slice(0, 2).toUpperCase() : 'VIP'}
              </div>
              <span className="text-xs font-mono text-amber-200/90 hidden sm:inline truncate max-w-[120px]">
                {user.email || 'MINDMILL VIP'}
              </span>
              <button
                onClick={handleSignOut}
                className="p-1.5 text-slate-400 hover:text-rose-400 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center space-x-2 bg-[#12151D] hover:bg-[#1A1E29] text-amber-200 font-semibold px-4 py-2 rounded-2xl text-xs transition border border-amber-500/20 shadow-lg"
            >
              <LogIn className="w-4 h-4 text-amber-400" />
              <span>Login / Sign Up</span>
            </button>
          )}

          <button
            onClick={() => { setEditingNote(null); resetForm(); setIsModalOpen(true); }}
            className="flex items-center space-x-2 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-600 hover:from-emerald-300 hover:to-teal-500 text-slate-950 font-black px-5 py-2.5 rounded-2xl text-xs transition shadow-lg shadow-emerald-500/20 active:scale-95 tracking-wide uppercase"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Log Trade</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full space-y-8 relative z-10">
        
        {/* Metric Cards Row - Gold / Obsidian Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div className="bg-gradient-to-b from-[#12151E] to-[#0B0D13] border border-amber-500/15 rounded-3xl p-5 relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300 shadow-2xl">
            <div className="absolute right-4 top-4 p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Total Net Yield</p>
            <h3 className={`text-2xl lg:text-3xl font-black font-mono mt-2 ${stats.totalPnl >= 0 ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]' : 'text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.3)]'}`}>
              {stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <div className="mt-3 flex items-center text-[11px] text-slate-400 font-mono">
              <span className="text-amber-400 font-bold mr-1">Peak Session:</span> ${stats.bestWin.toLocaleString()}
            </div>
          </div>

          <div className="bg-gradient-to-b from-[#12151E] to-[#0B0D13] border border-amber-500/15 rounded-3xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300 shadow-2xl">
            <div className="absolute right-4 top-4 p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Percent className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Success Ratio</p>
            <h3 className="text-2xl lg:text-3xl font-black font-mono mt-2 text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              {stats.winRate}%
            </h3>
            <div className="mt-3 flex items-center text-[11px] text-slate-400 font-mono">
              <span className="text-emerald-400 font-bold mr-1">{notes.filter(n => n.type === 'WIN').length} Wins</span> / {stats.totalTrades} Executions
            </div>
          </div>

          <div className="bg-gradient-to-b from-[#12151E] to-[#0B0D13] border border-amber-500/15 rounded-3xl p-5 relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300 shadow-2xl">
            <div className="absolute right-4 top-4 p-2.5 rounded-2xl bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <Award className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Profit Factor</p>
            <h3 className="text-2xl lg:text-3xl font-black font-mono mt-2 text-amber-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.3)]">
              {stats.profitFactor}
            </h3>
            <div className="mt-3 flex items-center text-[11px] text-slate-400 font-mono">
              Risk Reward Index
            </div>
          </div>

          <div className="bg-gradient-to-b from-[#12151E] to-[#0B0D13] border border-amber-500/15 rounded-3xl p-5 relative overflow-hidden group hover:border-rose-500/40 transition-all duration-300 shadow-2xl">
            <div className="absolute right-4 top-4 p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Zap className="w-5 h-5 animate-pulse" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">High Impact Catalyst</p>
            <h3 className="text-2xl lg:text-3xl font-black font-mono mt-2 text-rose-400">
              {newsEvents.filter(e => e.impact === 'High').length} Events
            </h3>
            <div className="mt-3 flex items-center text-[11px] text-slate-400 font-mono">
              Global Feed Active
            </div>
          </div>
        </div>

        {/* Dashboard Section */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            
            {/* Candlestick Visualizer Panel */}
            <div className="bg-gradient-to-b from-[#0F1118] to-[#08090D] border border-amber-500/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-amber-500/10 pb-4">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_10px_#10B981] animate-pulse"></span>
                    <h2 className="text-lg font-bold text-amber-100 tracking-wide font-mono">PERSONAL CANDLESTICK PERFORMANCE CHART</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Real-time session visualization with green/red candlestick bodies & wicks.</p>
                </div>
              </div>

              {/* Chart Body */}
              <div className="bg-[#050608] rounded-2xl p-5 border border-amber-500/10 overflow-x-auto relative shadow-inner">
                <div className="min-w-[650px] flex items-end h-72 pt-10 pb-8 px-4 relative border-b border-slate-800/80">
                  <div className="flex items-end justify-start space-x-2 w-full h-full relative z-10">
                    {notes.slice().reverse().map((note) => {
                      const isWin = note.type === 'WIN';
                      const isLoss = note.type === 'LOSS';
                      const pnlMagnitude = Math.min(Math.max(Math.abs(note.pnl) / 15, 22), 80);
                      const isSelected = selectedNote?.id === note.id;

                      const bodyBg = isWin 
                        ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]' 
                        : isLoss 
                        ? 'bg-gradient-to-t from-rose-700 to-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]' 
                        : 'bg-amber-500';

                      const wickColor = isWin ? 'bg-emerald-300' : isLoss ? 'bg-rose-300' : 'bg-amber-300';

                      return (
                        <div 
                          key={note.id}
                          onClick={() => setSelectedNoteId(note.id)}
                          className="group relative flex flex-col items-center cursor-pointer flex-1 min-w-[24px] max-w-[36px] h-full justify-end transition-all duration-300"
                        >
                          {/* Hover Tooltip */}
                          <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none bg-[#0D0E14]/95 backdrop-blur-md text-slate-100 text-[11px] font-mono px-3 py-1.5 rounded-xl shadow-2xl border border-amber-500/30 whitespace-nowrap z-30 flex items-center space-x-2">
                            <span className="font-bold text-amber-200">{note.symbol}</span>
                            <span className={`font-black ${isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-amber-400'}`}>
                              {note.pnl >= 0 ? '+' : ''}${note.pnl}
                            </span>
                          </div>

                          <div className={`w-full flex flex-col items-center relative py-1 px-0.5 transition-transform duration-300 ${isSelected ? 'scale-110 z-20' : ''}`}>
                            <div className={`w-[2px] h-4 ${wickColor} opacity-90`}></div>
                            <div 
                              className={`w-full rounded-[2px] transition-all duration-300 ${bodyBg} ${isSelected ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-[#050608]' : ''}`}
                              style={{ height: `${pnlMagnitude}px` }}
                            ></div>
                            <div className={`w-[2px] h-4 ${wickColor} opacity-90`}></div>
                          </div>

                          <span className="text-[10px] text-slate-500 font-mono mt-2 font-medium">
                            {note.date ? note.date.slice(5) : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Note Details & Sidebar Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-gradient-to-b from-[#0F1118] to-[#08090D] border border-amber-500/15 rounded-3xl p-7 shadow-2xl">
                {selectedNote ? (
                  <div className="space-y-5">
                    <div className="flex justify-between items-center border-b border-amber-500/10 pb-4">
                      <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider font-mono ${
                          selectedNote.type === 'WIN' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        }`}>
                          {selectedNote.symbol} &bull; {selectedNote.type}
                        </span>
                        <h2 className="text-xl font-bold text-white mt-2 tracking-wide">{selectedNote.title}</h2>
                      </div>
                      <div className="flex space-x-2">
                        <button onClick={() => handleEditClick(selectedNote)} className="px-4 py-2 bg-[#171A24] hover:bg-[#202433] rounded-xl text-xs text-amber-200 border border-amber-500/20 transition">Edit</button>
                        <button onClick={(e) => handleDelete(selectedNote.id, e)} className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs border border-rose-500/20 transition">Delete</button>
                      </div>
                    </div>
                    <div className="bg-[#050608] p-5 rounded-2xl border border-amber-500/10 space-y-3">
                      <p className="text-slate-300 text-sm leading-relaxed">{selectedNote.content}</p>
                      {selectedNote.lessons && (
                        <div className="pt-3 border-t border-slate-800/80">
                          <p className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-1">Key Takeaway / Lesson:</p>
                          <p className="text-xs text-slate-400 italic">{selectedNote.lessons}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-500">Select a note from the chart or journal feed.</div>
                )}
              </div>

              {/* Sidebar List */}
              <div className="bg-gradient-to-b from-[#0F1118] to-[#08090D] border border-amber-500/15 rounded-3xl p-5 h-[480px] flex flex-col shadow-2xl">
                <h3 className="font-bold text-sm text-amber-200 tracking-wide mb-4 font-mono uppercase">Journal Log Feed</h3>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {filteredNotes.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => setSelectedNoteId(n.id)}
                      className={`p-4 rounded-2xl border text-xs cursor-pointer flex justify-between transition-all duration-300 ${
                        selectedNoteId === n.id ? 'bg-[#151924] border-amber-400 shadow-lg shadow-amber-500/10' : 'bg-[#050608] border-slate-800/80 hover:border-amber-500/30'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-white tracking-wide">{n.symbol}: {n.title}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">{n.date}</p>
                      </div>
                      <p className={`font-mono font-black text-sm ${n.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {n.pnl >= 0 ? '+' : ''}${n.pnl}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* News Section */}
        {activeTab === 'news' && (
          <div className="bg-gradient-to-b from-[#0F1118] to-[#08090D] border border-amber-500/20 rounded-3xl p-7 space-y-6 shadow-2xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-amber-500/10 pb-5">
              <div>
                <h2 className="text-lg font-bold text-amber-100 font-mono tracking-wide">GLOBAL MARKET INTELLIGENCE FEED</h2>
                <p className="text-xs text-slate-400 mt-1">High-impact economic catalysts synced for Forex, Indices, and Crypto markets.</p>
              </div>

              {/* News Controls & Custom Date Filter */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2 bg-[#050608] border border-amber-500/20 rounded-2xl px-3.5 py-2">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <input 
                    type="date"
                    value={newsDateFilter}
                    onChange={(e) => setNewsDateFilter(e.target.value)}
                    className="bg-transparent text-xs text-slate-200 focus:outline-none font-mono"
                  />
                  {newsDateFilter && (
                    <button onClick={() => setNewsDateFilter('')} className="text-slate-500 hover:text-slate-300 text-xs ml-1">✕</button>
                  )}
                </div>

                <select 
                  value={newsFilterCurrency}
                  onChange={(e) => setNewsFilterCurrency(e.target.value)}
                  className="bg-[#050608] border border-amber-500/20 rounded-2xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none font-mono"
                >
                  <option value="ALL">All Currencies</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                  <option value="AUD">AUD</option>
                  <option value="CAD">CAD</option>
                </select>

                <button
                  onClick={() => setIsCustomNewsModalOpen(true)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-bold px-4 py-2 rounded-2xl text-xs transition shadow-lg shadow-amber-500/20"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Custom Event</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-amber-500/10 text-amber-200/70 font-mono">
                    <th className="py-3 px-3">Date & Time</th>
                    <th className="py-3 px-3">Currency</th>
                    <th className="py-3 px-3">Impact</th>
                    <th className="py-3 px-3">Catalyst Title</th>
                    <th className="py-3 px-3">Forecast</th>
                    <th className="py-3 px-3">Previous</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 font-mono">
                  {filteredNews.length > 0 ? (
                    filteredNews.map((evt) => (
                      <tr key={evt.id} className="hover:bg-amber-500/5 transition duration-200">
                        <td className="py-3 px-3 text-slate-300">{evt.date} &bull; {evt.time}</td>
                        <td className="py-3 px-3 font-bold text-amber-300">{evt.country}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            evt.impact === 'High' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 
                            evt.impact === 'Medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {evt.impact}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-100">{evt.title}</td>
                        <td className="py-3 px-3 text-emerald-400 font-bold">{evt.forecast}</td>
                        <td className="py-3 px-3 text-slate-400">{evt.previous}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-500">
                        No market news events matched the selected date/currency filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* Modal: Add Custom News Event */}
      {isCustomNewsModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0F1118] border border-amber-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-amber-500/10 pb-3">
              <h3 className="text-base font-bold text-amber-200 font-mono">Add Custom Market Event</h3>
              <button onClick={() => setIsCustomNewsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomNews} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Event Title</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. NVDA Earnings or Fed Rate Decision" 
                  value={customNewsData.title} 
                  onChange={(e) => setCustomNewsData({...customNewsData, title: e.target.value})} 
                  className="w-full bg-[#050608] border border-slate-800 rounded-2xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Currency / Market</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="USD, EUR, BTC" 
                    value={customNewsData.country} 
                    onChange={(e) => setCustomNewsData({...customNewsData, country: e.target.value})} 
                    className="w-full bg-[#050608] border border-slate-800 rounded-2xl p-3 text-xs text-slate-200 uppercase focus:outline-none focus:border-amber-500 font-mono" 
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Impact Level</label>
                  <select 
                    value={customNewsData.impact} 
                    onChange={(e) => setCustomNewsData({...customNewsData, impact: e.target.value})} 
                    className="w-full bg-[#050608] border border-slate-800 rounded-2xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="High">High Impact</option>
                    <option value="Medium">Medium Impact</option>
                    <option value="Low">Low Impact</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Custom Date</label>
                  <input 
                    type="date" 
                    required 
                    value={customNewsData.date} 
                    onChange={(e) => setCustomNewsData({...customNewsData, date: e.target.value})} 
                    className="w-full bg-[#050608] border border-slate-800 rounded-2xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono" 
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Time</label>
                  <input 
                    type="text" 
                    placeholder="08:30 AM" 
                    value={customNewsData.time} 
                    onChange={(e) => setCustomNewsData({...customNewsData, time: e.target.value})} 
                    className="w-full bg-[#050608] border border-slate-800 rounded-2xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500" 
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsCustomNewsModalOpen(false)} 
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 font-bold text-xs text-slate-950 shadow-lg shadow-amber-500/20"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0F1118] border border-amber-500/30 rounded-3xl max-w-md w-full p-7 shadow-2xl space-y-5">
            <div className="flex justify-between items-center border-b border-amber-500/10 pb-3">
              <h3 className="text-base font-bold text-amber-200 font-mono">
                {isSignUp ? 'Create MINDMILL Account' : 'Trader Access'}
              </h3>
              <button 
                onClick={() => setAuthModalOpen(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {authError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs p-3 rounded-2xl font-mono">
                {authError}
              </div>
            )}

            <button
              onClick={handleGoogleSignIn}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center space-x-2 transition shadow-lg"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center my-3">
              <div className="flex-1 border-t border-slate-800"></div>
              <span className="px-3 text-[10px] text-slate-500 font-mono uppercase">Or Email Access</span>
              <div className="flex-1 border-t border-slate-800"></div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trader@mindmill.io"
                    className="w-full bg-[#050608] border border-slate-800 rounded-2xl pl-9 pr-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#050608] border border-slate-800 rounded-2xl pl-9 pr-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-bold py-2.5 px-4 rounded-2xl text-xs transition shadow-lg shadow-amber-500/20 mt-2"
              >
                {isSignUp ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <div className="text-center text-xs text-slate-400 pt-2">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button 
                onClick={() => { setIsSignUp(!isSignUp); setAuthError(''); }}
                className="text-amber-400 font-bold hover:underline"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0F1118] border border-amber-500/30 rounded-3xl max-w-xl w-full p-7 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-amber-500/10 pb-3">
              <h3 className="text-base font-bold text-amber-200 font-mono">{editingNote ? 'Edit Note' : 'Log Trade Performance'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Symbol</label>
                  <input type="text" required value={formData.symbol} onChange={(e) => setFormData({...formData, symbol: e.target.value})} className="w-full bg-[#050608] border border-slate-800 rounded-2xl p-2.5 text-xs text-slate-200 uppercase font-mono" />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Outcome</label>
                  <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full bg-[#050608] border border-slate-800 rounded-2xl p-2.5 text-xs text-slate-200">
                    <option value="WIN">WIN (Green Candle)</option>
                    <option value="LOSS">LOSS (Red Candle)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Title / Strategy</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full bg-[#050608] border border-slate-800 rounded-2xl p-2.5 text-xs text-slate-200" />
              </div>

              <div>
                <label className="text-xs text-slate-400">P&L Yield ($)</label>
                <input type="number" step="any" required value={formData.pnl} onChange={(e) => setFormData({...formData, pnl: e.target.value})} className="w-full bg-[#050608] border border-slate-800 rounded-2xl p-2.5 text-xs text-slate-200 font-mono" />
              </div>

              <div>
                <label className="text-xs text-slate-400">Trade Breakdown & Notes</label>
                <textarea rows="3" required value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} className="w-full bg-[#050608] border border-slate-800 rounded-2xl p-2.5 text-xs text-slate-200"></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 font-bold text-xs text-slate-950 shadow-lg shadow-amber-500/20">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
