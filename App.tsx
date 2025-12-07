import React, { useState, useEffect } from 'react';
import { 
  Map as MapIcon, 
  LayoutDashboard, 
  Settings, 
  MessageSquare, 
  Wallet, 
  Bluetooth, 
  Volume2,
  Share2,
  ShieldAlert,
  Battery,
  ShieldCheck,
  RefreshCw,
  Info,
  CreditCard,
  Plus,
  Trash2,
  User,
  ShoppingBag,
  Calendar,
  Phone,
  Hash,
  Pencil
} from 'lucide-react';
import { MapView } from './components/MapView';
import { SmartAssistant } from './components/SmartAssistant';
import { AppState, WalletStatus, Coordinates, WalletItem, WalletItemType } from './types';
import { generateWalletVoiceAlert, playAudioBuffer } from './services/geminiService';

// Initial location: via Stefano Franscini 32, 6500 Bellinzona (Scuola Cantonale di Commercio)
const INITIAL_WALLET_COORDS: Coordinates = { lat: 46.1966, lng: 9.0250 };

// Custom Logo Component to replace the JPG
const SafeWalletLogo = () => (
  <svg viewBox="0 0 360 80" className="w-full max-w-[180px] h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Wallet Icon Container */}
    <rect x="10" y="15" width="70" height="50" rx="8" fill="#0F3F68" />
    <path d="M10 25C10 20.5817 13.5817 17 18 17H72C76.4183 17 80 20.5817 80 25V35H10V25Z" fill="#165285" />
    <path d="M72 38H80V42C80 44.2091 78.2091 46 76 46H72V38Z" fill="#0F3F68" />
    <circle cx="76" cy="42" r="1.5" fill="#4B89BC" />
    
    {/* Location Pin inside Wallet */}
    <path d="M45 52C45 52 35 42.5 35 34.5C35 29.2 39.5 25 45 25C50.5 25 55 29.2 55 34.5C55 42.5 45 52 45 52Z" fill="white"/>
    <circle cx="45" cy="33" r="3" fill="#0F3F68"/>

    {/* Text: SafeWallet */}
    <text x="95" y="53" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="42" fill="#0F3F68" letterSpacing="-1">
      SafeWallet
    </text>
  </svg>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'assistant' | 'settings' | 'contents'>('dashboard');
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [geofenceEnabled, setGeofenceEnabled] = useState(true);
  const [antitheftEnabled, setAntitheftEnabled] = useState(false);
  
  // Wallet Contents State
  const [walletItems, setWalletItems] = useState<WalletItem[]>([
    { id: '1', type: 'credit', name: 'Mastercard Gold', issuer: 'UBS', number: '5412 3400 9910 2234', expiryDate: '12/28', supportPhone: '+41 44 828 33 00', color: 'from-slate-700 to-slate-900' },
    { id: '2', type: 'id', name: 'Carta d\'Identità', issuer: 'Svizzera', expiryDate: '05/30', color: 'from-emerald-600 to-emerald-800' }
  ]);
  
  // Add/Edit Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  
  const [newItemType, setNewItemType] = useState<WalletItemType>('credit');
  const [newItemName, setNewItemName] = useState('');
  const [newItemNumber, setNewItemNumber] = useState('');
  const [newItemIssueDate, setNewItemIssueDate] = useState('');
  const [newItemExpiryDate, setNewItemExpiryDate] = useState('');
  const [newItemSupportPhone, setNewItemSupportPhone] = useState('');
  const [newItemContactPhone, setNewItemContactPhone] = useState('');

  // Simulated State
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [walletStatus, setWalletStatus] = useState<WalletStatus>({
    isConnected: true,
    batteryLevel: 92,
    isLost: false,
    lastSeen: new Date(),
    location: INITIAL_WALLET_COORDS,
    distance: 0.5, // meters
    temperature: 'Molto Caldo'
  });

  // Permissions & Location Tracking
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(newCoords);
          
          // Simulate distance calc logic
          const dist = Math.random() * 2; // Close proximity simulation 
          setWalletStatus(prev => ({
             ...prev,
             distance: parseFloat(dist.toFixed(1)),
             temperature: dist < 1 ? 'Molto Caldo' : dist < 5 ? 'Caldo' : 'Freddo'
          }));
        },
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const handlePlaySound = async () => {
    if (isPlayingSound) return;
    setIsPlayingSound(true);
    
    // Use Gemini TTS for the alert
    const audioBuffer = await generateWalletVoiceAlert("SafeWallet è qui. Sicurezza attiva.");
    if (audioBuffer) {
      playAudioBuffer(audioBuffer);
    } else {
        alert("Bip bip! (TTS Fallito)");
    }
    
    setTimeout(() => setIsPlayingSound(false), 3000);
  };

  const startEditingItem = (item: WalletItem) => {
    setEditingItemId(item.id);
    setNewItemType(item.type);
    setNewItemName(item.name);
    setNewItemNumber(item.number || '');
    setNewItemIssueDate(item.issueDate || '');
    setNewItemExpiryDate(item.expiryDate || '');
    setNewItemSupportPhone(item.supportPhone || '');
    setNewItemContactPhone(item.contactPhone || '');
    setShowAddForm(true);
  };

  const addItemToWallet = () => {
    if (!newItemName.trim()) return;
    
    let color = 'from-slate-400 to-slate-600';
    switch(newItemType) {
      case 'credit': color = 'from-blue-800 to-slate-900'; break;
      case 'id': color = 'from-emerald-600 to-teal-800'; break;
      case 'loyalty': color = 'from-purple-600 to-indigo-800'; break;
      case 'member': color = 'from-red-600 to-red-900'; break;
      case 'other': color = 'from-blue-400 to-blue-600'; break;
    }

    if (editingItemId) {
      // Update existing
      setWalletItems(walletItems.map(item => item.id === editingItemId ? {
        ...item,
        type: newItemType,
        name: newItemName,
        color: color,
        number: newItemNumber,
        issueDate: newItemIssueDate,
        expiryDate: newItemExpiryDate,
        supportPhone: newItemSupportPhone,
        contactPhone: newItemContactPhone
      } : item));
    } else {
      // Create new
      const newItem: WalletItem = {
        id: Date.now().toString(),
        type: newItemType,
        name: newItemName,
        color: color,
        number: newItemNumber,
        issueDate: newItemIssueDate,
        expiryDate: newItemExpiryDate,
        supportPhone: newItemSupportPhone,
        contactPhone: newItemContactPhone
      };
      setWalletItems([...walletItems, newItem]);
    }
    
    // Reset Form
    setNewItemName('');
    setNewItemNumber('');
    setNewItemIssueDate('');
    setNewItemExpiryDate('');
    setNewItemSupportPhone('');
    setNewItemContactPhone('');
    setEditingItemId(null);
    setShowAddForm(false);
  };

  const deleteItem = (id: string) => {
    setWalletItems(walletItems.filter(item => item.id !== id));
  };

  const renderDashboard = () => (
    <div className="space-y-6 animate-fadeIn">
      {/* Premium Header Status */}
      <div className="flex justify-between items-end px-2">
         <div>
            <h2 className="text-3xl font-light text-slate-800">Buongiorno.</h2>
            <p className="text-slate-500">Il tuo SafeWallet è protetto.</p>
         </div>
         <div className="flex flex-col items-end">
            <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
               <ShieldCheck className="w-3 h-3" /> Attivo
            </span>
         </div>
      </div>

      {/* Main Wallet Card - KEEPING DARK BLUE FOR BRAND IDENTITY */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-1 rounded-2xl shadow-xl shadow-blue-900/20 border border-blue-800/50">
        <div className="bg-slate-900/50 rounded-xl p-6 relative overflow-hidden backdrop-blur-sm">
          {/* Background Texture Effect */}
          <div className="absolute inset-0 opacity-10 pattern-grid-lg"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-6">
             <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
                   <Wallet className="w-8 h-8 text-white" />
                </div>
                <div>
                   <h3 className="text-xl font-semibold text-white">Smart Wallet</h3>
                   <p className="text-blue-200 text-sm mt-1">Modello: Onyx Black</p>
                   <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-white/10 text-white px-2 py-1 rounded border border-white/20 backdrop-blur-md">
                        GPS Integrato nel tessuto
                      </span>
                   </div>
                </div>
             </div>

             <div className="flex items-center gap-6">
                <div className="text-center">
                   <p className="text-xs text-blue-200 uppercase tracking-wider mb-1">Batteria</p>
                   <div className="flex items-center gap-1 justify-center text-white">
                      <Battery className="w-4 h-4 text-emerald-400" />
                      <span className="font-mono text-lg">{walletStatus.batteryLevel}%</span>
                   </div>
                </div>
                <div className="w-px h-8 bg-blue-700/50"></div>
                <div className="text-center">
                   <p className="text-xs text-blue-200 uppercase tracking-wider mb-1">Prossimità</p>
                   <div className="flex items-center gap-1 justify-center text-white">
                      <Bluetooth className="w-4 h-4 text-blue-400" />
                      <span className="font-mono text-lg">{walletStatus.distance}m</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Primary Actions - Light Mode */}
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={handlePlaySound}
          disabled={isPlayingSound}
          className={`h-24 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border shadow-sm ${
            isPlayingSound 
              ? 'bg-blue-600 border-blue-500 animate-pulse text-white' 
              : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700'
          }`}
        >
          <Volume2 className="w-8 h-8" />
          <span className="font-medium">Trova (Suono)</span>
        </button>

        <button 
           onClick={() => setAntitheftEnabled(!antitheftEnabled)}
           className={`h-24 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border shadow-sm ${
             antitheftEnabled
               ? 'bg-red-50 border-red-200 text-red-600'
               : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700'
           }`}
        >
          <ShieldAlert className={`w-8 h-8 ${antitheftEnabled ? 'text-red-500' : 'text-slate-400'}`} />
          <span className="font-medium">{antitheftEnabled ? 'Antifurto Attivo' : 'Attiva Antifurto'}</span>
        </button>
      </div>

      {/* Crowd Find Network Status - Light Mode */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
         <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-50 p-2 rounded-full">
               <Share2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
               <h3 className="font-semibold text-slate-900 text-sm">Rete SafeWallet Svizzera</h3>
               <p className="text-xs text-slate-500">Copertura attiva nella tua zona</p>
            </div>
         </div>
         <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Densità segnale</span>
            <span className="text-blue-600 font-medium">Ottima</span>
         </div>
         <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full" style={{ width: '92%' }}></div>
         </div>
      </div>
    </div>
  );

  const renderContents = () => (
    <div className="h-full flex flex-col animate-fadeIn">
       <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-light text-slate-800">Contenuto Portafoglio</h2>
            <p className="text-slate-500 text-sm">Gestisci le carte presenti nel tuo SafeWallet</p>
          </div>
          <button 
            onClick={() => {
              setEditingItemId(null);
              setNewItemName('');
              setNewItemNumber('');
              setNewItemIssueDate('');
              setNewItemExpiryDate('');
              setNewItemSupportPhone('');
              setNewItemContactPhone('');
              setNewItemType('credit');
              setShowAddForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Aggiungi
          </button>
       </div>

       {showAddForm && (
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6 animate-fadeIn">
            <h3 className="font-medium text-slate-800 mb-4">{editingItemId ? 'Modifica Elemento' : 'Aggiungi Elemento'}</h3>
            <div className="flex flex-col gap-4">
               {/* Type Selection */}
               <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Tipo Carta</label>
                  <div className="flex gap-2 flex-wrap">
                     <button onClick={() => setNewItemType('credit')} className={`flex-1 py-2 px-2 text-sm rounded-lg border transition-all ${newItemType === 'credit' ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium' : 'bg-slate-50 border-slate-200'}`}>Credito</button>
                     <button onClick={() => setNewItemType('id')} className={`flex-1 py-2 px-2 text-sm rounded-lg border transition-all ${newItemType === 'id' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-medium' : 'bg-slate-50 border-slate-200'}`}>Identità</button>
                     <button onClick={() => setNewItemType('loyalty')} className={`flex-1 py-2 px-2 text-sm rounded-lg border transition-all ${newItemType === 'loyalty' ? 'bg-purple-50 border-purple-500 text-purple-700 font-medium' : 'bg-slate-50 border-slate-200'}`}>Fedeltà</button>
                     <button onClick={() => setNewItemType('member')} className={`flex-1 py-2 px-2 text-sm rounded-lg border transition-all ${newItemType === 'member' ? 'bg-red-50 border-red-500 text-red-700 font-medium' : 'bg-slate-50 border-slate-200'}`}>Membro</button>
                     <button onClick={() => setNewItemType('other')} className={`flex-1 py-2 px-2 text-sm rounded-lg border transition-all ${newItemType === 'other' ? 'bg-blue-50 border-blue-400 text-blue-600 font-medium' : 'bg-slate-50 border-slate-200'}`}>Altro</button>
                  </div>
               </div>

               {/* Main Details */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nome / Istituto</label>
                    <input 
                      type="text" 
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="Es. Visa UBS"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Numero (Opzionale)</label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={newItemNumber}
                        onChange={(e) => setNewItemNumber(e.target.value)}
                        placeholder="•••• •••• •••• ••••"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 font-mono text-sm"
                      />
                    </div>
                  </div>
               </div>

               {/* Dates */}
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Rilascio</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={newItemIssueDate}
                        onChange={(e) => setNewItemIssueDate(e.target.value)}
                        placeholder="MM/AA"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Scadenza</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={newItemExpiryDate}
                        onChange={(e) => setNewItemExpiryDate(e.target.value)}
                        placeholder="MM/AA"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>
               </div>

               {/* Phones */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tel. Smarrimento (Blocco)</label>
                    <div className="relative">
                      <ShieldAlert className="absolute left-3 top-2.5 w-4 h-4 text-red-400" />
                      <input 
                        type="text" 
                        value={newItemSupportPhone}
                        onChange={(e) => setNewItemSupportPhone(e.target.value)}
                        placeholder="+41 ..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tel. Contatto</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={newItemContactPhone}
                        onChange={(e) => setNewItemContactPhone(e.target.value)}
                        placeholder="+41 ..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>
               </div>

               <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-2">
                  <button onClick={() => { setShowAddForm(false); setEditingItemId(null); }} className="text-slate-500 hover:text-slate-700 text-sm px-3 py-2 font-medium">Annulla</button>
                  <button onClick={addItemToWallet} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-6 py-2 rounded-lg font-medium shadow-sm transition-colors">
                    {editingItemId ? 'Aggiorna' : 'Salva Carta'}
                  </button>
               </div>
            </div>
         </div>
       )}

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 overflow-y-auto pb-20 md:pb-0">
          {walletItems.map(item => (
            <div key={item.id} className={`relative group h-56 rounded-2xl p-6 bg-gradient-to-br ${item.color} shadow-lg text-white flex flex-col justify-between overflow-hidden transition-transform hover:scale-[1.01]`}>
               {/* Decorative Elements */}
               <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
               <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>

               {/* Top Row */}
               <div className="flex justify-between items-start z-10">
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                     {item.type === 'credit' && <CreditCard className="w-4 h-4" />}
                     {item.type === 'id' && <User className="w-4 h-4" />}
                     {item.type === 'loyalty' && <ShoppingBag className="w-4 h-4" />}
                     {item.type === 'member' && <User className="w-4 h-4" />}
                     {item.type === 'other' && <Wallet className="w-4 h-4" />}
                     <span className="text-xs font-semibold uppercase tracking-wide">{item.type}</span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEditingItem(item)} className="bg-black/20 hover:bg-blue-500/80 p-2 rounded-lg text-white">
                       <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="bg-black/20 hover:bg-red-500/80 p-2 rounded-lg text-white">
                       <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
               </div>

               {/* Card Name & Issuer */}
               <div className="z-10 mt-2">
                  <h3 className="text-xl font-bold tracking-wide text-shadow-sm truncate">{item.name}</h3>
                  {item.issuer && <p className="text-sm text-white/80 mt-0.5">{item.issuer}</p>}
               </div>
               
               {/* Bottom Details Row */}
               <div className="z-10 mt-auto pt-4">
                   {/* Card Number Display */}
                   {item.number ? (
                      <p className="font-mono text-lg tracking-widest opacity-90 mb-3 shadow-black/10 text-shadow">
                        {item.type === 'credit' ? `•••• •••• •••• ${item.number.slice(-4)}` : item.number}
                      </p>
                   ) : (
                      item.type === 'credit' && <p className="font-mono text-lg tracking-widest opacity-60 mb-3">•••• •••• •••• ••••</p>
                   )}

                   {/* Date & Contact Info */}
                   <div className="flex justify-between items-end text-xs opacity-80">
                      <div>
                        {item.expiryDate && (
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase">Scadenza</span>
                            <span className="font-mono text-sm">{item.expiryDate}</span>
                          </div>
                        )}
                      </div>
                      
                      {item.supportPhone && (
                         <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded hover:bg-white/30 cursor-pointer" title="Tel. Blocco">
                            <ShieldAlert className="w-3 h-3" />
                            <span>Blocca</span>
                         </div>
                      )}
                   </div>
               </div>
            </div>
          ))}
          
          {walletItems.length === 0 && !showAddForm && (
             <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 bg-slate-50/50">
                <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                   <CreditCard className="w-6 h-6 text-slate-300" />
                </div>
                <p className="font-medium text-slate-600">Il portafoglio è vuoto</p>
                <p className="text-xs text-slate-400 mt-1 mb-3">Aggiungi carte per tracciarle</p>
                <button onClick={() => { setNewItemType('credit'); setShowAddForm(true); }} className="bg-white border border-slate-200 hover:border-blue-400 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all">
                   + Aggiungi Carta
                </button>
             </div>
          )}
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col md:flex-row selection:bg-blue-200 selection:text-blue-900">
      
      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 z-50 px-6 py-4 flex justify-between items-center safe-area-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
         <NavButton icon={<LayoutDashboard />} label="Home" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
         <NavButton icon={<MapIcon />} label="Mappa" active={activeTab === 'map'} onClick={() => setActiveTab('map')} />
         <NavButton icon={<CreditCard />} label="Contenuto" active={activeTab === 'contents'} onClick={() => setActiveTab('contents')} />
         <NavButton icon={<MessageSquare />} label="AI" active={activeTab === 'assistant'} onClick={() => setActiveTab('assistant')} />
      </div>

      {/* Desktop Sidebar - Light Mode */}
      <div className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200 p-8 shadow-sm z-10">
        <div className="mb-12 px-2">
           {/* Custom SVG Logo */}
           <SafeWalletLogo />
        </div>
        
        <nav className="space-y-2 flex-1">
          <SidebarButton icon={<LayoutDashboard />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarButton icon={<MapIcon />} label="Geolocalizzazione" active={activeTab === 'map'} onClick={() => setActiveTab('map')} />
          <SidebarButton icon={<CreditCard />} label="Contenuto" active={activeTab === 'contents'} onClick={() => setActiveTab('contents')} />
          <SidebarButton icon={<MessageSquare />} label="Assistente IA" active={activeTab === 'assistant'} onClick={() => setActiveTab('assistant')} />
          <SidebarButton icon={<Settings />} label="Impostazioni" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="mt-auto bg-slate-50 p-4 rounded-xl border border-slate-200">
           <div className="flex items-center gap-2 text-slate-700 mb-1">
             <Info className="w-4 h-4 text-blue-600" />
             <span className="text-xs font-semibold">Supporto Premium</span>
           </div>
           <p className="text-[10px] text-slate-500 leading-relaxed">
             Hai diritto alla manutenzione e sostituzione del sistema GPS.
           </p>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative h-screen pb-24 md:pb-0">
        <div className="h-full w-full p-4 md:p-8 overflow-y-auto max-w-5xl mx-auto">
          
          {activeTab === 'dashboard' && renderDashboard()}
          
          {activeTab === 'contents' && renderContents()}

          {activeTab === 'map' && (
            <div className="h-full w-full flex flex-col animate-fadeIn">
               <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-light text-slate-800">Posizione in Tempo Reale</h2>
                  <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs border border-blue-200 font-medium">
                    Aggiornamento Live
                  </span>
               </div>
               <div className="flex-1 rounded-2xl overflow-hidden border border-slate-200 relative shadow-xl">
                 <MapView 
                    walletLocation={walletStatus.location} 
                    userLocation={userLocation}
                    geofenceRadius={geofenceEnabled ? 50 : 0}
                 />
                 {/* Map Overlay Controls */}
                 <div className="absolute bottom-6 left-6 z-[400] bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-xl min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                       <p className="text-xs text-slate-500 font-bold uppercase">Segnale GPS</p>
                    </div>
                    <p className="text-sm font-mono text-slate-900">
                      {walletStatus.location.lat.toFixed(5)}, {walletStatus.location.lng.toFixed(5)}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                       Precisione: ±2.4m
                    </p>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'assistant' && (
             <div className="h-full animate-fadeIn flex flex-col">
               <h2 className="text-2xl font-light text-slate-800 mb-6">Assistente SafeWallet</h2>
               <div className="flex-1 bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl">
                 <SmartAssistant userLocation={userLocation} walletItems={walletItems} />
               </div>
             </div>
          )}

          {activeTab === 'settings' && (
             <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
                <h2 className="text-2xl font-light text-slate-800">Impostazioni & Sicurezza</h2>
                
                {/* Security Section */}
                <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                   <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-slate-900">Sicurezza Attiva</h3>
                   </div>
                   
                   <div className="p-6 space-y-6">
                      <div className="flex items-center justify-between">
                          <div>
                            <p className="text-slate-900 font-medium">Geofence Personalizzato</p>
                            <p className="text-sm text-slate-500">Notifica all'uscita da zone sicure (Casa, Ufficio)</p>
                          </div>
                          <Toggle checked={geofenceEnabled} onChange={setGeofenceEnabled} />
                      </div>

                      <div className="flex items-center justify-between">
                          <div>
                            <p className="text-slate-900 font-medium">Modalità Antifurto</p>
                            <p className="text-sm text-slate-500">Suono automatico se rimosso dalla tasca</p>
                          </div>
                          <Toggle checked={antitheftEnabled} onChange={setAntitheftEnabled} />
                      </div>
                   </div>
                </div>

                {/* Maintenance Service (From Business Plan) */}
                <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                   <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-emerald-500" />
                      <h3 className="font-semibold text-slate-900">Manutenzione Dispositivo</h3>
                   </div>
                   <div className="p-6">
                      <div className="flex items-center gap-4 mb-4">
                         <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                            <Wallet className="w-6 h-6 text-slate-400" />
                         </div>
                         <div>
                            <p className="font-medium text-slate-900">Piano SafeWallet Care</p>
                            <p className="text-sm text-emerald-600">Attivo • Rinnovo 06/2026</p>
                         </div>
                      </div>
                      <p className="text-sm text-slate-500 mb-4">
                        Il servizio include l'aggiornamento e la sostituzione del chip GPS integrato nel tessuto in caso di malfunzionamento o obsolescenza tecnologica.
                      </p>
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        Gestisci abbonamento &rarr;
                      </button>
                   </div>
                </div>

                {/* Info */}
                <div className="text-center pt-8 border-t border-slate-200">
                   <p className="text-slate-500 text-sm">SafeWallet Sagl</p>
                   <p className="text-slate-400 text-xs mt-1">Sviluppato in Svizzera • P.IVA CHE-123.456.789</p>
                </div>
             </div>
          )}

        </div>
      </main>
    </div>
  );
}

// UI Components
const NavButton = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-colors ${active ? 'text-blue-600' : 'text-slate-400'}`}
  >
    {React.cloneElement(icon, { size: 22 })}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

const SidebarButton = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all mb-1 group ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    {React.cloneElement(icon, { size: 20, className: active ? 'text-white' : 'text-slate-400 group-hover:text-slate-900' })}
    <span className="font-medium text-sm">{label}</span>
  </button>
);

const Toggle = ({ checked, onChange }: any) => (
  <button 
    onClick={() => onChange(!checked)}
    className={`w-12 h-6 rounded-full relative transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}
  >
    <div className={`w-4 h-4 bg-white rounded-full shadow-sm absolute top-1 transition-all duration-300 ${checked ? 'left-7' : 'left-1'}`} />
  </button>
);