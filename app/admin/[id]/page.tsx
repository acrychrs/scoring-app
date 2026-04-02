'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/app/lib/supabase' 
import { useParams } from 'next/navigation'

export default function ManageEvent() {
  const params = useParams()
  const id = params?.id as string
  
  const [teams, setTeams] = useState<any[]>([])
  const [games, setGames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'teams' | 'games'>('teams')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  const [newTeam, setNewTeam] = useState('')
  const [gameForm, setGameForm] = useState({ name: '', pic_name: '', pic_phone: '' })
  const [maxScore, setMaxScore] = useState(50)

  const fetchData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const { data: t } = await supabase.from('teams').select(`id, team_name, scores (game_id)`).eq('event_id', id)
      const formattedTeams = t?.map((team: any) => ({
        ...team,
        done_at_games: team.scores.map((s: any) => s.game_id)
      })) || []
      const { data: g } = await supabase.from('games').select('*').eq('event_id', id)
      setTeams(formattedTeams)
      setGames(g || [])
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  const copyToClipboard = (slug: string, id: string) => {
    const link = `${window.location.origin}/pos/${slug}`
    navigator.clipboard.writeText(link)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const addTeam = async () => {
    if (!newTeam) return
    await supabase.from('teams').insert([{ event_id: id, team_name: newTeam }])
    setNewTeam(''); fetchData()
  }

  const saveGame = async () => {
    if (!gameForm.name || !gameForm.pic_phone) return alert("Isi Nama Pos & WA!")
    await supabase.from('games').insert([{
      event_id: id,
      name: gameForm.name,
      pic_name: gameForm.pic_name,
      pic_phone: gameForm.pic_phone,
      score_options: [maxScore],
      max_score: maxScore
    }])
    setGameForm({ name: '', pic_name: '', pic_phone: '' }); fetchData()
  }

  if (loading) return <div className="h-screen flex items-center justify-center bg-white font-black text-indigo-600 uppercase italic tracking-widest">Loading Dashboard...</div>

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md p-4 border-b border-slate-200 shadow-sm">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <button onClick={() => window.location.href = '/admin'} className="text-xs font-black text-indigo-600 uppercase italic tracking-tighter">← Back</button>
          <h1 className="text-xl font-black italic uppercase tracking-tighter text-indigo-600">Event Control</h1>
          <div className="w-8"></div>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4">
        <div className="flex bg-slate-200 p-1 rounded-2xl mb-8 shadow-inner">
          <button onClick={() => setActiveTab('teams')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === 'teams' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500'}`}>Groups ({teams.length})</button>
          <button onClick={() => setActiveTab('games')} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === 'games' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-500'}`}>Stations ({games.length})</button>
        </div>

        {activeTab === 'teams' ? (
          <div className="animate-fade-up">
            <div className="bg-white p-6 rounded-[2.5rem] mb-6 shadow-xl shadow-indigo-50 border border-indigo-50">
              <h3 className="font-black text-[10px] uppercase text-slate-400 mb-4 tracking-widest italic uppercase">Register Team</h3>
              <div className="flex gap-2">
                <input type="text" value={newTeam} onChange={(e) => setNewTeam(e.target.value)} placeholder="Team Name..." className="flex-1 bg-slate-100 p-4 rounded-2xl outline-none font-bold" />
                <button onClick={addTeam} className="bg-indigo-600 text-white px-6 rounded-2xl font-black shadow-lg shadow-indigo-200 active:scale-95">ADD</button>
              </div>
            </div>
            <div className="grid gap-3">
              {teams.map(t => (
                <div key={t.id} className="bg-white p-5 rounded-2xl font-black flex justify-between items-center border-l-8 border-indigo-500 shadow-sm">
                  <div className="flex flex-col">
                    <span className="uppercase italic">{t.team_name}</span>
                    <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">{t.done_at_games.length} / {games.length} Games Done</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="animate-fade-up">
            <div className="bg-white p-6 rounded-[2.5rem] mb-8 shadow-xl shadow-indigo-50 border border-indigo-50">
              <h3 className="font-black text-[10px] uppercase text-slate-400 mb-4 tracking-widest italic text-center">Configure Station</h3>
              <div className="space-y-3">
                <input type="text" placeholder="Station Name" className="w-full bg-slate-100 p-4 rounded-2xl outline-none font-bold" value={gameForm.name} onChange={(e) => setGameForm({...gameForm, name: e.target.value})} />
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="PIC Name" className="bg-slate-100 p-4 rounded-2xl outline-none font-bold text-sm" value={gameForm.pic_name} onChange={(e) => setGameForm({...gameForm, pic_name: e.target.value})} />
                  <input type="text" placeholder="WA (628...)" className="bg-slate-100 p-4 rounded-2xl outline-none font-bold text-sm" value={gameForm.pic_phone} onChange={(e) => setGameForm({...gameForm, pic_phone: e.target.value})} />
                </div>
                <div className="py-4">
                  <p className="text-[9px] font-black uppercase text-indigo-500 mb-3 tracking-widest text-center">Max Score:</p>
                  <div className="grid grid-cols-5 gap-2">
                    {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(n => (
                      <button key={n} onClick={() => setMaxScore(n)} className={`py-3 rounded-xl font-black text-xs transition-all ${maxScore === n ? 'bg-indigo-600 text-white shadow-lg scale-110' : 'bg-slate-100 text-slate-400'}`}>{n}</button>
                    ))}
                  </div>
                </div>
                <button onClick={saveGame} className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-200 uppercase tracking-widest text-xs">Save Station ➔</button>
              </div>
            </div>

            <div className="grid gap-4">
              {games.map(g => {
                const teamsDone = teams.filter(t => t.done_at_games?.includes(g.id)).length;
                return (
                  <div key={g.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-black text-xl text-slate-900 uppercase italic leading-none">{g.name}</h4>
                        <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">PIC: {g.pic_name}</p>
                      </div>
                      <div className="flex gap-2">
                        {/* TOMBOL COPY LINK */}
                        <button 
                          onClick={() => copyToClipboard(g.slug, g.id)}
                          className={`p-3 rounded-xl shadow-lg transition-all active:scale-90 ${copiedId === g.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                        >
                          {copiedId === g.id ? <span className="text-[10px] font-black">COPIED!</span> : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m-9 8h10m-5-5h5"/></svg>}
                        </button>
                        
                        {/* TOMBOL WHATSAPP */}
                        <button onClick={() => window.open(`https://wa.me/${g.pic_phone}?text=${encodeURIComponent('Link Pos ' + g.name + ': ' + window.location.origin + '/pos/' + g.slug)}`, '_blank')} className="bg-green-500 text-white p-3 rounded-xl shadow-lg active:scale-90 transition-all">
                          <svg width="18" height="18" fill="white" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/></svg>
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                      <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${(teamsDone / (teams.length || 1)) * 100}%` }}></div>
                    </div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic mb-3">{teamsDone} / {teams.length} Teams Completed</p>
                    
                    <details className="group/details border-t border-slate-50 pt-3">
                      <summary className="text-[9px] font-black text-indigo-600 uppercase cursor-pointer list-none flex items-center gap-2 italic">➔ Attendance Progress</summary>
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        {teams.map(t => {
                          const played = t.done_at_games?.includes(g.id);
                          return (
                            <div key={t.id} className={`p-2.5 rounded-xl text-[8px] font-black uppercase flex items-center gap-2 border ${played ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-400 opacity-50'}`}>
                              <span>{played ? '✅' : '⏳'}</span> {t.team_name}
                            </div>
                          )
                        })}
                      </div>
                    </details>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}