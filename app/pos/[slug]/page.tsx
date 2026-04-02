'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabase'
import { useParams } from 'next/navigation'

export default function PosPanitia() {
  const { slug } = useParams()
  const [game, setGame] = useState<any>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState<any>(null)
  const [offlineQueue, setOfflineQueue] = useState<any[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  const fetchData = async () => {
    if (!slug) return
    const { data: g } = await supabase.from('games').select('*').eq('slug', slug).single()
    if (g) {
      setGame(g)
      const { data: t } = await supabase.from('teams').select(`id, team_name, scores(id)`).eq('event_id', g.event_id).eq('scores.game_id', g.id)
      setTeams(t?.map(x => ({ ...x, done: x.scores.length > 0 })) || [])
    }
    setLoading(false)
  }

  // 1. LOAD AWAL & INTERVAL AUTO-SYNC
  useEffect(() => {
    fetchData()
    // Ambil data offline dari HP
    const saved = localStorage.getItem(`offline_scores_${slug}`)
    if (saved) setOfflineQueue(JSON.parse(saved))

    // SETUP AUTO-SYNC: Cek tiap 30 detik
    const syncInterval = setInterval(() => {
      autoSync()
    }, 30000) 

    return () => clearInterval(syncInterval)
  }, [slug])

  // 2. LOGIC AUTO-SYNC (BACKGROUND PROCESS)
  const autoSync = async () => {
    const saved = localStorage.getItem(`offline_scores_${slug}`)
    const queue = saved ? JSON.parse(saved) : []
    
    if (queue.length === 0 || isSyncing) return

    setIsSyncing(true)
    const remainingQueue = [...queue]
    let successAny = false

    for (const item of queue) {
      try {
        const { error } = await supabase.from('scores').insert([{ 
          team_id: item.team_id, 
          game_id: item.game_id, 
          score: item.score 
        }])
        
        if (!error) {
          remainingQueue.shift() // Hapus yang berhasil
          successAny = true
        } else {
          break; // Kalau error (sinyal mati lagi), stop loop
        }
      } catch (e) {
        break;
      }
    }

    if (successAny) {
      setOfflineQueue(remainingQueue)
      localStorage.setItem(`offline_scores_${slug}`, JSON.stringify(remainingQueue))
      fetchData() // Refresh list biar status 'DONE' update
    }
    setIsSyncing(false)
  }

  const addScore = async (val: number) => {
    if (!confirm(`Konfirmasi +${val} poin untuk ${selectedTeam.team_name}?`)) return

    const newScore = { 
      team_id: selectedTeam.id, 
      team_name: selectedTeam.team_name,
      game_id: game.id, 
      score: val,
      timestamp: new Date().toISOString()
    }

    try {
      const { error } = await supabase.from('scores').insert([{ 
        team_id: newScore.team_id, 
        game_id: newScore.game_id, 
        score: newScore.score 
      }])

      if (error) throw error
      console.log("Online Success")
    } catch (err) {
      // SIMPAN LOKAL KALAU OFFLINE
      const currentQueue = JSON.parse(localStorage.getItem(`offline_scores_${slug}`) || '[]')
      const updatedQueue = [...currentQueue, newScore]
      setOfflineQueue(updatedQueue)
      localStorage.setItem(`offline_scores_${slug}`, JSON.stringify(updatedQueue))
    }

    setSelectedTeam(null)
    fetchData()
  }

  if (loading) return <div className="h-screen flex items-center justify-center bg-white font-black text-indigo-600">PREPARING POS...</div>

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20">
      
      {/* STATUS BAR AUTO-SYNC */}
      {offlineQueue.length > 0 && (
        <div className="bg-orange-500 text-white p-3 text-center font-black text-[10px] uppercase tracking-[0.2em] sticky top-0 z-50 flex justify-between items-center px-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
            <span>{offlineQueue.length} DATA PENDING (AUTO-SYNCING...)</span>
          </div>
          <button onClick={autoSync} disabled={isSyncing} className="bg-white text-orange-600 px-3 py-1 rounded-full text-[8px] font-black">
            {isSyncing ? 'WAIT...' : 'SYNC NOW'}
          </button>
        </div>
      )}

      <div className="bg-white border-b border-slate-200 p-6 text-center shadow-sm">
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">{game?.name}</h1>
        <p className="text-[10px] font-black text-slate-400 mt-1">Sinyal naik-turun? Santai, otomatis ke-save.</p>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-3">
        {teams.map(t => {
          const isPending = offlineQueue.some(q => q.team_id === t.id);
          return (
            <button 
              key={t.id} 
              disabled={t.done || isPending} 
              onClick={() => setSelectedTeam(t)} 
              className={`w-full flex justify-between items-center p-5 rounded-2xl border-2 transition-all ${
                isPending ? 'border-orange-400 bg-orange-50' : 
                t.done ? 'bg-slate-100 border-transparent opacity-50' : 'bg-white border-white shadow-sm hover:border-indigo-100'
              }`}
            >
              <span className="text-lg font-black uppercase italic text-left leading-none">{t.team_name}</span>
              <div className={`px-4 py-2 rounded-xl font-black text-[10px] ${
                isPending ? 'bg-orange-500 text-white' : 
                t.done ? 'bg-slate-200 text-slate-400' : 'bg-indigo-600 text-white shadow-lg'
              }`}>
                {isPending ? 'PENDING SYNC' : t.done ? 'DONE' : 'INPUT SCORE ➔'}
              </div>
            </button>
          )
        })}
      </div>

      {/* MODAL INPUT */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 p-4 flex items-center justify-center animate-fade-up">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl">
            <h3 className="text-2xl font-black text-indigo-900 text-center uppercase mb-8 leading-tight">{selectedTeam.team_name}</h3>
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: (game.max_score / 10) }, (_, i) => (i + 1) * 10).map((s) => (
                <button 
                  key={s} 
                  onClick={() => addScore(s)} 
                  className="bg-indigo-600 text-white py-6 rounded-[1.5rem] shadow-xl active:scale-90 transition-all border-b-[6px] border-indigo-900"
                >
                  <span className="text-3xl font-black">+{s}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setSelectedTeam(null)} className="w-full mt-8 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">← Tutup</button>
          </div>
        </div>
      )}
    </div>
  )
}